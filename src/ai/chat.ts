import type { User } from "@microsoft/microsoft-graph-types";
import type OpenAI from "openai";

import { executeTool } from "./executeTool";
import { aiTools } from "./tools";

type ChatContext = {
    graphAccessToken: string;
    users?: User[];
};

export async function chat(
    client: OpenAI,
    message: string,
    context: ChatContext,
): Promise<string> {
    const now = new Date();

    const jstNow = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).format(now);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: [
                "あなたは社内の飲み会調整Botです。",
                "ユーザーの依頼に応じて利用可能なToolを使用してください。",
                `現在日時は ${jstNow}（日本時間）です。`,
                "日時を扱う場合は日本時間（JST）を基準にしてください。",
                "Toolへ日時を渡す場合はISO 8601形式の+09:00オフセットを使用してください。",
                "ユーザーが複数のユーザーを対象としている場合、まず対象ユーザーを検索してから予定を取得してください。",
                "予定取得では対象ユーザー全員が参加可能な時間を(18時から24時まで)返してください。",
            ].join("\n"),
        },
        {
            role: "user",
            content: message,
        },
    ];

    const maxToolRounds = 5;

    for (let round = 0; round < maxToolRounds; round++) {

        const requestStart = Date.now();

        let completion;


        completion = await client.chat.completions.create(
            {
                model: "orcarouter/auto",
                messages,
                tools: aiTools,
                tool_choice: "auto",
            },
            {
                timeout: 30000,
            },
        );



        const choice = completion.choices[0];

        if (!choice) {
            throw new Error("AIから応答が返されませんでした。");
        }

        const assistantMessage = choice.message;


        messages.push({
            role: "assistant",
            content: assistantMessage.content,
            tool_calls: assistantMessage.tool_calls,
        });

        if (!assistantMessage.tool_calls?.length) {
            return assistantMessage.content ?? "";
        }

        for (const toolCall of assistantMessage.tool_calls) {
            if (toolCall.type !== "function") {
                continue;
            }

            let arguments_: unknown;

            try {
                arguments_ = JSON.parse(toolCall.function.arguments);
            } catch (error) {
                console.error("Tool arguments JSON parse error:", error);

                throw new Error(
                    `Toolの引数をJSONとして解析できませんでした: ${toolCall.function.name}`,
                );
            }



            const result = await executeTool(
                toolCall.function.name,
                arguments_,
                context,
            );


            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
            });
        }
    }

    throw new Error("AIのTool呼び出しが上限回数を超えました。");
}