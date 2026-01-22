import { spawn } from "child_process";
import autocannon from "autocannon";
import chalk from "chalk";
import ora from "ora";

const frameworks = [
  { name: "AzuraJS", port: 3000, cmd: "npx", args: ["tsx", "servers/azura.ts"], color: "#00D9FF" },
  { name: "Elysia", port: 3001, cmd: "bun", args: ["servers/elysia.ts"], color: "#FF79C6" },
  { name: "Hono", port: 3002, cmd: "node", args: ["servers/hono.js"], color: "#FF6347" },
  { name: "Fastify", port: 3003, cmd: "node", args: ["servers/fastify.js"], color: "#000000" },
  { name: "Express", port: 3004, cmd: "node", args: ["servers/express.js"], color: "#259DFF" },
];

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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer(framework) {
  return new Promise((resolve, reject) => {
    const spinner = ora(`Starting ${framework.name}...`).start();

    const server = spawn(framework.cmd, framework.args, {
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    let errorOutput = "";

    server.stdout.on("data", (data) => {
      output += data.toString();
      if (
        data.toString().includes("started") ||
        data.toString().includes("running") ||
        data.toString().includes("listening")
      ) {
        spinner.succeed(`${framework.name} started`);
        resolve(server);
      }
    });

    server.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    server.on("error", (error) => {
      spinner.fail(`${framework.name} failed: ${error.message}`);
      console.error(`Error output: ${errorOutput}`);
      resolve(server);
    });

    setTimeout(() => {
      if (errorOutput) {
        spinner.warn(`${framework.name} started with warnings`);
        console.log(`Output: ${output}`);
        console.log(`Errors: ${errorOutput}`);
      } else {
        spinner.succeed(`${framework.name} started (timeout)`);
      }
      resolve(server);
    }, 3000);
  });
}

async function runBenchmark(framework, benchmark) {
  const url = `http://localhost:${framework.port}${benchmark.path}`;

  return new Promise((resolve) => {
    const options = {
      url,
      connections: 100,
      pipelining: benchmark.body ? 1 : 10, // Pipelining precisa ser 1 para POST com body
      duration: 10,
      method: benchmark.method,
      body: benchmark.body,
      headers: benchmark.headers || {},
    };

    autocannon(options, (err, result) => {
      if (err) {
        console.error(err);
        resolve(null);
      } else {
        resolve({
          requests: result.requests.total,
          throughput: result.throughput.total,
          latency: result.latency.mean,
          reqPerSec: result.requests.mean,
          errors: result.errors,
        });
      }
    });
  });
}

function printResults(results) {
  console.log("\n" + chalk.bold.cyan("═".repeat(120)));
  console.log(
    chalk.bold.cyan(
      "                                     BENCHMARK RESULTS                                     ",
    ),
  );
  console.log(chalk.bold.cyan("═".repeat(120)));

  for (const [benchName, frameworkResults] of Object.entries(results)) {
    console.log("\n" + chalk.bold.yellow(`\n📊 ${benchName}`));
    console.log(chalk.gray("─".repeat(120)));

    const sorted = Object.entries(frameworkResults)
      .filter(([, result]) => result !== null)
      .sort((a, b) => b[1].reqPerSec - a[1].reqPerSec);

    console.log(
      chalk.bold(
        "  Framework".padEnd(20) +
          "Req/Sec".padEnd(20) +
          "Total Requests".padEnd(20) +
          "Latency (ms)".padEnd(20) +
          "Throughput (MB/s)".padEnd(20) +
          "Errors",
      ),
    );
    console.log(chalk.gray("─".repeat(120)));

    sorted.forEach(([frameworkName, result], index) => {
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
            `${result.reqPerSec.toFixed(2).padEnd(20)}` +
            `${result.requests.toLocaleString().padEnd(20)}` +
            `${result.latency.toFixed(2).padEnd(20)}` +
            `${(result.throughput / 1024 / 1024).toFixed(2).padEnd(20)}` +
            `${result.errors}`,
        ),
      );
    });
  }

  console.log("\n" + chalk.bold.cyan("═".repeat(120)));

  // Overall winner calculation
  const scores = {};
  for (const frameworkResults of Object.values(results)) {
    for (const [frameworkName, result] of Object.entries(frameworkResults)) {
      if (result) {
        scores[frameworkName] = (scores[frameworkName] || 0) + result.reqPerSec;
      }
    }
  }

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  console.log(
    "\n" +
      chalk.bold.green(
        `🏆 Overall Winner: ${winner[0]} with ${winner[1].toFixed(2)} total req/sec across all tests`,
      ),
  );
  console.log(chalk.bold.cyan("═".repeat(120)) + "\n");
}

async function main() {
  console.log(chalk.bold.cyan("\n🚀 Starting Benchmark Suite\n"));
  console.log(chalk.gray("Frameworks: " + frameworks.map((f) => f.name).join(", ")));
  console.log(chalk.gray("Duration per test: 10 seconds"));
  console.log(chalk.gray("Connections: 100, Pipelining: 10\n"));

  const servers = [];

  // Start all servers
  for (const framework of frameworks) {
    const server = await startServer(framework);
    servers.push({ framework, process: server });
    await sleep(1000);
  }

  console.log("\n" + chalk.green("✓ All servers started\n"));
  await sleep(2000);

  // Run benchmarks
  for (const benchmark of benchmarks) {
    console.log(chalk.bold.magenta(`\n⚡ Running: ${benchmark.name}`));
    results[benchmark.name] = {};

    for (const { framework, process: serverProcess } of servers) {
      const spinner = ora(`Testing ${framework.name}...`).start();

      const result = await runBenchmark(framework, benchmark);
      results[benchmark.name][framework.name] = result;

      if (result) {
        spinner.succeed(`${framework.name}: ${result.reqPerSec.toFixed(2)} req/sec`);
      } else {
        spinner.fail(`${framework.name}: Failed`);
      }

      await sleep(1000);
    }
  }

  // Stop all servers
  console.log("\n" + chalk.yellow("Stopping servers..."));
  for (const { process: serverProcess } of servers) {
    serverProcess.kill();
  }

  // Print results
  printResults(results);

  process.exit(0);
}

main().catch(console.error);
