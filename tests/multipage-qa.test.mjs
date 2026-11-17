import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const origin = process.env.SAGAR_TEST_ORIGIN;
const fixturePath = process.env.SAGAR_QA_FIXTURE;
if (
  !/^http:\/\/(?:localhost|127\.0\.0\.1):3001$/.test(origin || "") ||
  !fixturePath?.startsWith("/private/tmp/sagar-multipage-qa-")
)
  throw new Error("Use only the disposable multipage QA server on port 3001.");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
let cookie = "";
async function request(path, method = "GET", data, revision) {
  return fetch(`${origin}${path}`, {
    method,
    redirect: "manual",
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(data ? { "content-type": "application/json" } : {}),
      ...(revision ? { "if-match": String(revision) } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

test("a growing catalogue supports complete real HTTP page navigation", async () => {
  assert.equal((await request(`/fish/${fixture.customId}`)).status, 200);
  assert.equal((await request(`/fish/${fixture.archivedId}`)).status, 404);
  for (const [page, count] of [
    [1, 12],
    [2, 12],
    [3, 5],
  ]) {
    const response = await request(`/shop?page=${page}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.equal(
      (html.match(/<article class="product-card/g) || []).length,
      count,
    );
  }
});

test("authenticated catalogue history is private, paginated and attributes actual changes", async () => {
  assert.equal((await request("/api/admin/history")).status, 401);
  const login = await request("/api/admin/login", "POST", {
    email: "qa@example.test",
    password: "sagar-qa-owner-2026",
  });
  assert.equal(login.status, 200, await login.clone().text());
  cookie = login.headers.get("set-cookie").split(";")[0];
  const first = await (await request("/api/admin/history?limit=25")).json();
  assert.equal(first.entries.length, 25);
  assert.ok(first.nextCursor);
  const second = await (
    await request(`/api/admin/history?limit=25&cursor=${first.nextCursor}`)
  ).json();
  assert.ok(second.entries.length > 0);
  assert.ok(
    second.entries.every((entry) => entry.id < first.entries.at(-1).id),
  );
  const before = await (await request("/api/admin/products")).json();
  const saved = await request(
    "/api/admin/products/catla",
    "PATCH",
    { pricePerKg: 311 },
    before.revision,
  );
  assert.equal(saved.status, 200);
  const latest = await (await request("/api/admin/history?limit=1")).json();
  assert.deepEqual(latest.entries[0].actor, {
    name: "QA Owner",
    email: "qa@example.test",
  });
  assert.deepEqual(
    latest.entries[0].changes.find((change) => change.field === "pricePerKg"),
    { field: "pricePerKg", before: 240, after: 311 },
  );
  assert.equal(
    (
      await request(
        "/api/admin/products/catla",
        "PATCH",
        { pricePerKg: 1 },
        before.revision,
      )
    ).status,
    409,
  );
  const afterFailure = await (
    await request("/api/admin/history?limit=1")
  ).json();
  assert.equal(afterFailure.entries[0].id, latest.entries[0].id);
  const current = await (await request("/api/admin/products")).json();
  assert.equal(
    (
      await request(
        "/api/admin/products/catla",
        "PATCH",
        { pricePerKg: 240 },
        current.revision,
      )
    ).status,
    200,
  );
});
