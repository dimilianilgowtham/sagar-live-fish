import assert from "node:assert/strict";
import test from "node:test";

const origin = process.env.SAGAR_TEST_ORIGIN;
if (!origin) throw new Error("Set SAGAR_TEST_ORIGIN to the local QA server.");

test("unknown fish return a real 404 response", async () => {
  const response = await fetch(`${origin}/fish/not-a-real-fish`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /This catch has|ఈ చేప వివరాలు/);
});

test("customer pages and existing fish details are reachable", async () => {
  for (const path of [
    "/",
    "/shop",
    "/fish/catla",
    "/delivery",
    "/contact",
    "/how-to-order",
    "/wholesale",
  ]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /Sagar Live Fish/);
  }
});

test("catalogue history remains private", async () => {
  const response = await fetch(`${origin}/api/admin/history`);
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.match((await response.json()).error, /sign in/i);
});

test(
  "archived fish return 404",
  { skip: !process.env.SAGAR_TEST_ARCHIVED_ID },
  async () => {
    const response = await fetch(
      `${origin}/fish/${encodeURIComponent(process.env.SAGAR_TEST_ARCHIVED_ID)}`,
    );
    assert.equal(response.status, 404);
  },
);
