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

  console.log("=== BOT MESSAGE START ===");
  console.log("Activity text:", activity.text);

  const userMessage = activity.text?.trim();

  if (!userMessage) {
    console.log("No user message.");
    return c.json({});
  }

  c.executionCtx.waitUntil(
    processMessage(c, activity, userMessage),
  );

  console.log("Returning 200 OK immediately.");

  return c.json({});
});

async function processMessage(
  c: Context<AppEnv>,
  activity: AppEnv["Variables"]["activity"],
  userMessage: string,
): Promise<void> {
  try {
    console.log("=== ASYNC BOT PROCESS START ===");

    const botAccessToken = await getBotAccessToken(c.env);
    const graphAccessToken = await getGraphAccessToken(c.env);

    console.log("Creating OrcaRouter client...");

    const orcaRouterClient = createOrcaRouterClient(
      c.env.ORCAROUTER_API_KEY,
    );

    console.log("Calling chat...");

    const response = await chat(
      orcaRouterClient,
      userMessage,
      {
        graphAccessToken,
      },
    );

    console.log("chat completed.");
    console.log("AI response:", response);

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

    console.log("Teams reply sent.");
    console.log("=== ASYNC BOT PROCESS END ===");
  } catch (error) {
    console.error("=== ASYNC BOT PROCESS ERROR ===");
    console.error(error);

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

      console.log("Error message sent to Teams.");
    } catch (replyError) {
      console.error(
        "Failed to send error message to Teams:",
        replyError,
      );
    }
  }
}

export default bot;