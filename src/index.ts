import { Hono } from "hono";
import bot from "./routes/bot";

const app = new Hono();

app.get("/", (c) => {
  return c.text("飲み会誘うマン Backend");
});

app.route("/api/bot", bot);

export default app;