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

process.on("SIGTERM", async () => {
  await app.shutdown();
});

process.on("SIGINT", async () => {
  await app.shutdown();
});
