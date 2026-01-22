import { spawn } from "child_process";
import autocannon from "autocannon";
import chalk from "chalk";
import ora from "ora";
import http from "node:http";

const azura = {
  name: "AzuraJS",
  port: 3000,
  cmd: "npx",
  args: ["tsx", "servers/azura.ts"],
  color: "#00D9FF",
};

const benchmarks = [
  { name: "Simple GET", path: "/", method: "GET" },
  { name: "JSON Response", path: "/json", method: "GET" },
  {
    name: "POST JSON Echo",
    path: "/echo",
    method: "POST",
    body: JSON.stringify({ test: "data" }),
    headers: { "content-type": "application/json" },
  },
  { name: "Route Params", path: "/user/123", method: "GET" },
  { name: "Query String", path: "/query?name=John", method: "GET" },
];

const results = {};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForServer(port, path = "/", timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.request(
        { method: "HEAD", hostname: "127.0.0.1", port, path, timeout: 2000 },
        (res) => {
          res.destroy();
          resolve(true);
        },
      );
      req.on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error("Timeout waiting for server"));
        } else {
          setTimeout(tryOnce, 200);
        }
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error("Timeout waiting for server"));
        } else {
          setTimeout(tryOnce, 200);
        }
      });
      req.end();
    };
    tryOnce();
  });
}

async function startServer(framework) {
  const spinner = ora(`Starting ${framework.name}...`).start();
  const server = spawn(framework.cmd, framework.args, {
    stdio: "pipe",
    shell: true,
  });
  let stderr = "";
  server.stderr.on("data", (d) => {
    stderr += d.toString();
  });
  try {
    await waitForServer(framework.port, "/", 10000);
    spinner.succeed(`${framework.name} started`);
    return server;
  } catch (err) {
    spinner.warn(`${framework.name} did not respond in time`);
    if (stderr) console.log(stderr);
    return server;
  }
}

function runAutocannon(options) {
  return new Promise((resolve) => {
    autocannon(options, (err, result) => {
      if (err) return resolve(null);
      resolve(result);
    });
  });
}

async function runBenchmark(framework, benchmark) {
  const url = `http://127.0.0.1:${framework.port}${benchmark.path}`;
  const options = {
    url,
    connections: 100,
    pipelining: benchmark.body ? 1 : 10,
    duration: 10,
    method: benchmark.method,
    body: benchmark.body,
    headers: benchmark.headers || {},
  };
  const result = await runAutocannon(options);
  if (!result) return null;
  return {
    requests: result.requests.total,
    throughput: result.throughput.total,
    latency: result.latency.mean,
    reqPerSec: result.requests.mean,
    errors: result.errors,
  };
}

function printResults(results) {
  console.log("\n" + chalk.bold.cyan("═".repeat(100)));
  console.log(
    chalk.bold.cyan(
      "                                     BENCHMARK RESULTS                                     ",
    ),
  );
  console.log(chalk.bold.cyan("═".repeat(100)));
  for (const [benchName, frameworkResults] of Object.entries(results)) {
    console.log("\n" + chalk.bold.yellow(`\n📊 ${benchName}`));
    console.log(chalk.gray("─".repeat(100)));
    const entries = Object.entries(frameworkResults).filter(([, r]) => r !== null);
    console.log(
      chalk.bold(
        "  Framework".padEnd(20) +
          "Req/Sec".padEnd(15) +
          "Total Requests".padEnd(18) +
          "Latency (ms)".padEnd(15) +
          "Throughput (MB/s)".padEnd(18) +
          "Errors",
      ),
    );
    console.log(chalk.gray("─".repeat(100)));
    entries.forEach(([frameworkName, result], index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
      const color =
        index === 0
          ? chalk.green
          : index === 1
            ? chalk.blue
            : index === 2
              ? chalk.magenta
              : chalk.white;
      console.log(
        color(
          `${medal} ${frameworkName.padEnd(17)}` +
            `${result.reqPerSec.toFixed(2).padEnd(15)}` +
            `${result.requests.toLocaleString().padEnd(18)}` +
            `${result.latency.toFixed(2).padEnd(15)}` +
            `${(result.throughput / 1024 / 1024).toFixed(2).padEnd(18)}` +
            `${result.errors}`,
        ),
      );
    });
  }
  console.log("\n" + chalk.bold.cyan("═".repeat(100)) + "\n");
}

(async () => {
  console.log(chalk.bold.cyan("\n🚀 Starting AzuraJS Benchmark Suite\n"));
  console.log(chalk.gray("Duration per test: 10 seconds"));
  console.log(chalk.gray("Connections: 100, Pipelining: 10\n"));
  const server = await startServer(azura);
  await sleep(1000);
  for (const bench of benchmarks) {
    console.log(chalk.bold.magenta(`\n⚡ Running: ${bench.name}`));
    results[bench.name] = {};
    const spinner = ora(`Testing ${azura.name}...`).start();
    const res = await runBenchmark(azura, bench);
    results[bench.name][azura.name] = res;
    if (res) {
      spinner.succeed(`${azura.name}: ${res.reqPerSec.toFixed(2)} req/sec`);
      console.log(
        chalk.green(
          `✔ ${bench.name} | ${res.reqPerSec.toFixed(0)} req/s | ${res.latency.toFixed(2)} ms | ${(res.throughput / 1024 / 1024).toFixed(2)} MB/s`,
        ),
      );
    } else {
      spinner.fail(`${azura.name}: Failed`);
    }
    await sleep(1000);
  }
  try {
    server.kill("SIGTERM");
  } catch (e) {}
  printResults(results);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
