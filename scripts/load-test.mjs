import { performance } from "node:perf_hooks";

const origin = new URL(process.env.SAGAR_TEST_ORIGIN || "http://127.0.0.1:3001").origin;
const local = /^http:\/\/(?:127\.0\.0\.1|localhost):3001$/.test(origin);
if (!local && !(process.env.SAGAR_ALLOW_LIVE_LOAD === "1" && origin === process.env.NEXT_PUBLIC_SITE_URL))
  throw new Error("Use the isolated QA server on port 3001. Live tests require explicit opt-in and the configured shop origin.");
const count = Number(process.env.SAGAR_LOAD_REQUESTS || 1000);
const concurrency = Number(process.env.SAGAR_LOAD_CONCURRENCY || 20);
if (!Number.isSafeInteger(count) || count < 1 || count > 10_000 || !Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 100)
  throw new Error("Use 1–10000 requests and 1–100 concurrent clients.");
try {
  const ready = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(5000) });
  if (!ready.ok) throw new Error(`Health check returned ${ready.status}`);
} catch {
  console.error("HTTP load test not run: the isolated QA server is unreachable or unhealthy. Start it on port 3001 and retry.");
  process.exit(1);
}
const paths = ["/api/catalogue", "/", "/shop", "/fish/catla", "/contact", "/delivery", "/how-to-order", "/wholesale"];
let next = 0;
const timings = [], failures = [];
const started = performance.now();
await Promise.all(Array.from({ length: concurrency }, async () => {
  for (;;) {
    const index = next++;
    if (index >= count) return;
    const path = paths[index % paths.length];
    const at = performance.now();
    try {
      const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "SagarLaunchQA/1.0" } });
      await response.arrayBuffer();
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
      timings.push(performance.now() - at);
    } catch (failure) { failures.push({ path, error: failure.message }); }
  }
}));
timings.sort((a, b) => a - b);
const percentile = p => Math.round(timings[Math.min(timings.length - 1, Math.floor(timings.length * p))] || 0);
const elapsedMs = Math.round(performance.now() - started);
console.log(JSON.stringify({ origin, requests: count, concurrency, successful: timings.length, failures: failures.length, elapsedMs, requestsPerSecond: Number((count / (elapsedMs / 1000)).toFixed(1)), latencyMs: { p50: percentile(.5), p95: percentile(.95), p99: percentile(.99) }, failureSamples: failures.slice(0, 5) }, null, 2));
if (failures.length) process.exitCode = 1;
