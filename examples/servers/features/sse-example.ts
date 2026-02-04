import { AzuraClient } from "../../../package/azurajs/src/infra/Server";
import { createSSEHandler } from "../../../package/azurajs/src/shared/plugins";

const app = new AzuraClient();
const sse = createSSEHandler();

app.get("/events", (req, res) => {
  const connectionId = sse.connect(res);
  console.log(`SSE client connected: ${connectionId}`);
});

app.post("/broadcast", (req, res) => {
  const body = req.body as { event?: string; data?: unknown };
  const { event = "message", data = "" } = body;
  sse.sendToAll(event, data);
  res.json({ message: "Event broadcasted" });
});

app.post("/channel/:channel", (req, res) => {
  const { channel = "" } = req.params;
  const body = req.body as { event?: string; data?: unknown };
  const { event = "message", data = "" } = body;
  sse.sendToChannel(channel, event, data);
  res.json({ message: `Event sent to channel: ${channel}` });
});

app.post("/subscribe/:connectionId/:channel", (req, res) => {
  const { connectionId = "", channel = "" } = req.params;
  sse.subscribe(connectionId, channel);
  res.json({ message: `Subscribed to channel: ${channel}` });
});

setInterval(() => {
  sse.sendToAll("time", { timestamp: Date.now() });
}, 5000);

await app.listen(3000);
