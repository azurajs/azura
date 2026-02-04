import { AzuraClient } from "../../../package/azurajs/src/infra/Server";
import { compression, helmet, csrf, etag, timeout, multipart, serveStatic } from "../../../package/azurajs/src/shared/plugins";

const app = new AzuraClient();

app.use(helmet());
app.use(compression({ threshold: 1024, level: 6 }));
app.use(etag());
app.use(timeout({ timeout: 30000 }));

app.use("/public", serveStatic("./public", {
  maxAge: 86400,
  etag: true,
  extensions: [".html"],
  index: ["index.html"],
}));

app.use(csrf());

app.use(multipart({
  uploadDir: "./uploads",
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5,
  storeInMemory: false,
}));

app.get("/", (req, res) => {
  res.json({ message: "AzuraJS Advanced Example" });
});

app.post("/upload", (req: any, res) => {
  const files = req.files || [];
  res.json({
    message: "Files uploaded successfully",
    files: files.map((f: any) => ({
      name: f.originalname,
      size: f.size,
      path: f.path,
    })),
  });
});

app.get("/csrf-token", (req: any, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const server = await app.listen(3000);

const ws = app.websocket("/ws");

ws.on("connect", (client) => {
  console.log(`Client connected: ${client.id}`);
  ws.send(client.id, JSON.stringify({ type: "welcome", message: "Connected to WebSocket" }));
});

ws.on("message", (client, message) => {
  console.log(`Message from ${client.id}:`, message.toString());
  ws.broadcast(JSON.stringify({ from: client.id, message: message.toString() }), client.id);
});

ws.on("close", (client) => {
  console.log(`Client disconnected: ${client.id}`);
});

process.on("SIGTERM", async () => {
  await app.shutdown();
});

process.on("SIGINT", async () => {
  await app.shutdown();
});
