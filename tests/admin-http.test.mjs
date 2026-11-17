import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

// Run only against an isolated QA server, never the owner's live database.
const origin = process.env.SAGAR_TEST_ORIGIN;
if (!origin)
  throw new Error("Set SAGAR_TEST_ORIGIN to an isolated test server.");
const password = "sagar-test-owner-2026";
const account = { name: "Test Owner", email: "owner@example.test", password };
let cookie = "";
const request = async (path, method = "GET", data, revision) => {
  const headers = { origin };
  if (cookie) headers.cookie = cookie;
  if (revision) headers["if-match"] = String(revision);
  if (data !== undefined) headers["content-type"] = "application/json";
  return fetch(`${origin}${path}`, {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
    redirect: "manual",
  });
};

test("protected catalogue and photo lifecycle works across independent HTTP requests", async (t) => {
  await t.test(
    "anonymous catalogue writes and private reads are rejected",
    async () => {
      const privateRead = await request("/api/admin/products");
      assert.equal(privateRead.status, 401);
      assert.equal(
        (await request("/api/admin/products", "POST", {})).status,
        401,
      );
      const wrongOrigin = await fetch(`${origin}/api/admin/products`, {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "content-type": "application/json",
        },
        body: "{}",
      });
      assert.equal(wrongOrigin.status, 403);
    },
  );
  await t.test(
    "local owner setup signs in once and sets an HttpOnly cookie",
    async () => {
      const setup = await request("/api/admin/setup", "POST", account);
      assert.equal(setup.status, 201, await setup.clone().text());
      assert.match(setup.headers.get("set-cookie"), /HttpOnly/i);
      assert.match(setup.headers.get("set-cookie"), /SameSite=Lax/i);
      cookie = setup.headers.get("set-cookie").split(";")[0];
      assert.equal(
        (await request("/api/admin/setup", "POST", account)).status,
        409,
      );
    },
  );
  await t.test(
    "login rejects wrong credentials and accepts the owner",
    async () => {
      assert.equal(
        (
          await request("/api/admin/login", "POST", {
            email: account.email,
            password: "wrong-password",
          })
        ).status,
        401,
      );
      const login = await request("/api/admin/login", "POST", {
        email: account.email,
        password,
      });
      assert.equal(login.status, 200);
      cookie = login.headers.get("set-cookie").split(";")[0];
      const body = await login.json();
      assert.deepEqual(body.owner, {
        name: account.name,
        email: account.email,
      });
    },
  );
  await t.test(
    "owner price/stock edits are visible through the public API",
    async () => {
      const original = await (await request("/api/admin/products")).json();
      const originalProduct = original.products.find((p) => p.id === "catla");
      const saved = await request(
        "/api/admin/products/catla",
        "PATCH",
        { pricePerKg: 275, isAvailable: false },
        original.revision,
      );
      assert.equal(saved.status, 200, await saved.clone().text());
      const next = await saved.json();
      const publicCatch = await (await request("/api/catalogue")).json();
      assert.equal(
        publicCatch.products.find((p) => p.id === "catla").pricePerKg,
        275,
      );
      assert.equal(
        publicCatch.products.find((p) => p.id === "catla").isAvailable,
        false,
      );
      assert.equal(
        (
          await request(
            "/api/admin/products/catla",
            "PATCH",
            { pricePerKg: 1 },
            original.revision,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await request(
            "/api/admin/products/catla",
            "PATCH",
            { pricePerKg: -1 },
            next.revision,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await request(
            "/api/admin/products/catla",
            "PATCH",
            originalProduct,
            next.revision,
          )
        ).status,
        200,
      );
    },
  );
  await t.test(
    "photos are sanitised and new products can be archived and restored",
    async () => {
      const bytes = await sharp({
        create: { width: 24, height: 24, channels: 3, background: "#d2e3b8" },
      })
        .png()
        .toBuffer();
      const form = new FormData();
      form.set(
        "file",
        new File([bytes], "test-fish.png", { type: "image/png" }),
      );
      const upload = await fetch(`${origin}/api/admin/media`, {
        method: "POST",
        headers: { origin, cookie },
        body: form,
      });
      assert.equal(upload.status, 201, await upload.clone().text());
      const { image } = await upload.json();
      const photo = await fetch(`${origin}${image}`);
      assert.equal(photo.status, 200);
      assert.match(photo.headers.get("content-type"), /image\/webp/);
      const unsafe = new FormData();
      unsafe.set(
        "file",
        new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" }),
      );
      assert.equal(
        (
          await fetch(`${origin}/api/admin/media`, {
            method: "POST",
            headers: { origin, cookie },
            body: unsafe,
          })
        ).status,
        400,
      );
      let catalogue = await (await request("/api/admin/products")).json();
      const draft = {
        nameEn: "HTTP Test Fish",
        nameTe: "పరీక్ష చేప",
        category: "freshwater",
        descEn: "QA fixture",
        descTe: "పరీక్ష",
        pricePerKg: 300,
        isAvailable: true,
        cuts: ["Curry cut"],
        image,
      };
      const created = await request(
        "/api/admin/products",
        "POST",
        draft,
        catalogue.revision,
      );
      assert.equal(created.status, 201, await created.clone().text());
      catalogue = await created.json();
      const id = catalogue.products.find((p) => p.nameEn === draft.nameEn).id;
      let publicCatch = await (await request("/api/catalogue")).json();
      assert.equal(publicCatch.products.find((p) => p.id === id).image, image);
      catalogue = await (
        await request(
          `/api/admin/products/${id}`,
          "DELETE",
          undefined,
          catalogue.revision,
        )
      ).json();
      publicCatch = await (await request("/api/catalogue")).json();
      assert.equal(
        publicCatch.products.some((p) => p.id === id),
        false,
      );
      const restored = await request(
        `/api/admin/products/${id}`,
        "PATCH",
        { archived: false },
        catalogue.revision,
      );
      assert.equal(restored.status, 200);
      catalogue = await restored.json();
      assert.equal(catalogue.products.find((p) => p.id === id).archived, false);
      assert.equal(
        (
          await request(
            `/api/admin/products/${id}`,
            "DELETE",
            undefined,
            catalogue.revision,
          )
        ).status,
        200,
      );
    },
  );
  await t.test("logout revokes the existing session", async () => {
    assert.equal((await request("/api/admin/logout", "POST")).status, 200);
    assert.equal((await request("/api/admin/products")).status, 401);
  });
});
