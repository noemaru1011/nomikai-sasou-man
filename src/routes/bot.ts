import { Hono } from "hono";
import type { Context } from "hono";

type Bindings = {
  CLIENT_ID: string;
  TENANT_ID: string;
  CLIENT_SECRET: string;
};

type AppContext = Context<{
  Bindings: Bindings;
}>;

const bot = new Hono<{
  Bindings: Bindings;
}>();

bot.post("/messages", async (c) => {
  const activity = await c.req.json();

  console.log(
    "Bot Activity:",
    JSON.stringify(activity, null, 2),
  );

  const accessToken = await getBotAccessToken(c);

  const response = await fetch(
    `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "message",
        text: "こんにちは！メッセージを受信しました。",
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();

    console.error("Send message failed:", error);

    return c.json(
      {
        error: "Failed to send message",
      },
      500,
    );
  }

  return c.json({});
});

async function getBotAccessToken(c: AppContext): Promise<string> {
  const response = await fetch(
    `https://login.microsoftonline.com/${c.env.TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: c.env.CLIENT_ID,
        client_secret: c.env.CLIENT_SECRET,
        scope: "https://api.botframework.com/.default",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get access token: ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
  };

  return data.access_token;
}

export default bot;