import axios from "axios";
import { Hono } from "hono";
import type { Context } from "hono";

import { chat } from "../ai/chat";
import { createOrcaRouterClient } from "../ai/client";
import { getBotAccessToken } from "../services/auth/botAuth";
import { getGraphAccessToken } from "../services/auth/graphAuth";
import type { AppEnv } from "../types";

const bot = new Hono<AppEnv>();

bot.post("/messages", async (c) => {
  const activity =
    await c.req.json<AppEnv["Variables"]["activity"]>();

  c.set("activity", activity);

  const userMessage = activity.text?.trim();

  if (!userMessage) {
    return c.json({});
  }

  await processMessage(c, activity, userMessage);


  return c.json({});
});

async function processMessage(
  c: Context<AppEnv>,
  activity: AppEnv["Variables"]["activity"],
  userMessage: string,
): Promise<void> {
  try {

    const botAccessToken = await getBotAccessToken(c.env);
    const graphAccessToken = await getGraphAccessToken(c.env);


    const orcaRouterClient = createOrcaRouterClient(
      c.env.ORCAROUTER_API_KEY,
    );


    const response = await chat(
      orcaRouterClient,
      userMessage,
      {
        graphAccessToken,
      },
    );


    await axios.post(
      `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
      {
        type: "message",
        text: response,
      },
      {
        headers: {
          Authorization: `Bearer ${botAccessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

  } catch (error) {

    try {
      const botAccessToken = await getBotAccessToken(c.env);

      await axios.post(
        `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
        {
          type: "message",
          text: "処理中にエラーが発生しました。",
        },
        {
          headers: {
            Authorization: `Bearer ${botAccessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

    } catch (replyError) {
      console.error(
        "Failed to send error message to Teams:",
        replyError,
      );
    }
  }
}

export default bot;