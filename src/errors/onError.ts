import axios from "axios";
import type { ErrorHandler } from "hono";

import { getBotAccessToken } from "../services/botAuth";
import type { AppEnv } from "../types";

export const onError: ErrorHandler<AppEnv> = async (error, c) => {
    console.error("Unhandled Error:", error);

    const activity = c.get("activity");

    if (activity) {
        try {
            const accessToken = await getBotAccessToken(c.env);

            await axios.post(
                `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
                {
                    type: "message",
                    text: "申し訳ありません。処理に失敗しました。",
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
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

    return c.json(
        {
            error: error.message,
        },
        200,
    );
};