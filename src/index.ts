import { Hono } from "hono";

import bot from "./routes/bot";
import { onError } from "./errors/onError";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.onError(onError);

app.route("/api/bot", bot);

export default app;