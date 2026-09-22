import axios from "axios";
import type { ErrorHandler } from "hono";

import { getBotAccessToken } from "../services/auth/botAuth";
import type { AppEnv } from "../types";

export const onError: ErrorHandler<AppEnv> = async (error, c) => {
    //運用上はいったんこれだけ
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

    //アクティビティがあるなら、teamsに返信
    if (activity) {
        try {
            const accessToken = await getBotAccessToken(c.env);

            await axios.post(
                `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
                {
                    type: "message",
                    text: "申し訳ありません。処理に失敗しました。詳細はログを確認してください。",
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                },
            );
            //teamsに返信できないときは、そのエラーも記録
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