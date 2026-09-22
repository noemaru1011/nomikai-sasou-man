import axios from "axios";
import type { ErrorHandler } from "hono";

import { AppError } from "../errors/AppError";
import { getBotAccessToken } from "../services/auth/botAuth";
import type { AppEnv } from "../types";

export const onError: ErrorHandler<AppEnv> = async (error, c) => {
    // 運用上はいったんこれだけ
    if (axios.isAxiosError(error)) {
        console.error("Axios Error:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
    } else {
        console.error("Unhandled Error:", error);
    }

    const activity = c.get("activity");

    // アクティビティがあるなら、Teamsに返信
    if (activity) {
        try {
            const accessToken = await getBotAccessToken(c.env);

            const message =
                error instanceof AppError
                    ? error.message
                    : "予期せぬエラーが発生しました。申し訳ありません。処理に失敗しました。";

            await axios.post(
                `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
                {
                    type: "message",
                    text: message,
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

    // 中身は空オブジェクトにするが、ステータスは200を維持する
    return c.json({}, 200);
};