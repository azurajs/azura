import { AzuraClient } from "../../../package/src";
const app = new AzuraClient();

app.get("/", (req, res) => {
  res.json({ message: "Hello from AzuraJS on Bun!" });
});

app.get("/user/:id", (req, res) => {
  res.json({ userId: req.params.id });
});

app.post("/data", (req, res) => {
  res.json({ received: req.body });
});

// Use with Bun.serve
const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch: app.fetch.bind(app),
});

console.log(`\n🚀 AzuraJS running on Bun!`);
console.log(`   http://localhost:${server.port}/`);
console.log(`   http://localhost:${server.port}/user/123`);
