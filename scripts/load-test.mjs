/**
 * CampusCoder Load & Scalability Benchmark Suite
 * Tests concurrent load handling, caching response times, and rate limiting.
 * Usage: node scripts/load-test.mjs [targetUrl]
 */

const targetUrl = process.argv[2] || 'http://localhost:4000';

async function runBenchmark(endpoint, concurrency, totalRequests) {
  console.log(`\n======================================================`);
  console.log(`🚀 Benchmarking: ${endpoint}`);
  console.log(`⚡ Concurrency: ${concurrency} | Total Requests: ${totalRequests}`);
  console.log(`======================================================`);

  const latencies = [];
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  let cacheHits = 0;

  const url = `${targetUrl}${endpoint}`;
  const startTime = Date.now();

  let activeIndex = 0;

  async function worker() {
    while (activeIndex < totalRequests) {
      const idx = activeIndex++;
      const reqStart = performance.now();
      try {
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });
        const duration = performance.now() - reqStart;
        latencies.push(duration);

        if (res.status === 200) {
          successCount++;
          const cacheHeader = res.headers.get('x-cache');
          if (cacheHeader === 'HIT') cacheHits++;
        } else if (res.status === 429) {
          rateLimitedCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTime = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / totalTime).toFixed(1);

  console.log(`\n📊 RESULTS:`);
  console.log(`  ⏱️  Total Duration:     ${totalTime.toFixed(2)}s`);
  console.log(`  ⚡ Throughput:         ${rps} req/sec`);
  console.log(`  ✅ 200 OK:             ${successCount} (Cache Hits: ${cacheHits})`);
  console.log(`  🛡️  429 Rate Limited:   ${rateLimitedCount}`);
  console.log(`  ❌ Errors:             ${errorCount}`);
  console.log(`\n📈 LATENCY PERCENTILES:`);
  console.log(`  Avg: ${avg.toFixed(2)}ms | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms`);
}

async function main() {
  console.log(`Testing backend at ${targetUrl}...`);
  try {
    const health = await fetch(`${targetUrl}/health`);
    if (!health.ok) {
      console.log('Backend not currently responding at', targetUrl);
      console.log('Ensure `npm --prefix backend run dev` is running.');
      return;
    }
    const healthJson = await health.json();
    console.log('Backend is up:', healthJson);

    // Warm cache
    await fetch(`${targetUrl}/api/events`);

    // 1. Concurrent public events query (Cached)
    await runBenchmark('/api/events', 25, 200);

    // 2. High concurrency spike
    await runBenchmark('/api/events', 50, 500);

    // 3. Showcase query benchmark
    await runBenchmark('/api/showcase/projects', 25, 150);

    // Check health stats after load
    const finalHealth = await fetch(`${targetUrl}/health`).then(r => r.json());
    console.log('\n🏥 Final Backend Health & Cache Telemetry:', finalHealth);
  } catch (err) {
    console.log('Load test suite prepared. Run against active server via `node scripts/load-test.mjs`');
  }
}

main();
