import type { User } from "@microsoft/microsoft-graph-types";
import type OpenAI from "openai";

import { executeTool } from "./executeTool";
import { aiTools } from "./tools";
import { AppError } from "../errors/AppError";

type ChatContext = {
    graphAccessToken: string;
    users?: User[];
};

export async function chat(
    client: OpenAI,
    message: string,
    context: ChatContext,
): Promise<string> {

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "user",
            content: message,
        },
    ];

    const maxToolRounds = 5;

    for (let round = 0; round < maxToolRounds; round++) {


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
            throw new AppError("AIから応答が返されませんでした。");
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

                throw new AppError(
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

    throw new AppError("AIのTool呼び出しが上限回数を超えました。");
}