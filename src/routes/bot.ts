import axios from "axios";
import { Hono } from "hono";

import { getBotAccessToken } from "../services/botAuth";
import { getGraphAccessToken } from "../services/graphAuth";
import type { AppEnv } from "../types";

const bot = new Hono<AppEnv>();

bot.post("/messages", async (c) => {
  const activity = (await c.req.json()) as AppEnv["Variables"]["activity"];

  c.set("activity", activity);

  // Bot Frameworkのアクセストークン
  const botAccessToken = await getBotAccessToken(c.env);

  // Microsoft Graphのアクセストークン
  const graphAccessToken = await getGraphAccessToken(c.env);

  // メッセージを送信したユーザー
  const aadObjectId = activity.from?.aadObjectId;

  if (!aadObjectId) {
    throw new Error("送信者のaadObjectIdが取得できませんでした");
  }

  // Graphからユーザー情報を取得
  const userResponse = await axios.get<{
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
  }>(
    `https://graph.microsoft.com/v1.0/users/${aadObjectId}?$select=displayName,mail,userPrincipalName`,
    {
      headers: {
        Authorization: `Bearer ${graphAccessToken}`,
      },
    },
  );

  const user = userResponse.data;

  const email = user.mail ?? user.userPrincipalName;

  if (!email) {
    throw new Error("メールアドレスが取得できませんでした");
  }

  console.log("Request user:", {
    displayName: user.displayName,
    email,
  });

  // Teamsへ返信
  await axios.post(
    `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
    {
      type: "message",
      text: `あなたのメールアドレスは ${email} です。`,
    },
    {
      headers: {
        Authorization: `Bearer ${botAccessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return c.json({});
});

export default bot;