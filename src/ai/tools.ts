import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const aiTools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "findUsers",
            description:
                "部署、入社年、Teamsのチーム、チャネルなどの条件からユーザーを検索します。複数条件を指定できます。",
            parameters: {
                type: "object",
                properties: {
                    department: {
                        type: "string",
                        description: "部署名",
                    },
                    hireYear: {
                        type: "number",
                        description: "入社年",
                    },
                    teamName: {
                        type: "string",
                        description: "Teamsのチーム名",
                    },
                    channelName: {
                        type: "string",
                        description: "Teamsのチャネル名",
                    },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "searchUsersByDepartment",
            description:
                "指定した部署に所属するユーザーを検索します。",
            parameters: {
                type: "object",
                properties: {
                    department: {
                        type: "string",
                        description: "部署名",
                    },
                },
                required: ["department"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "searchUsersByHireYear",
            description:
                "指定した入社年のユーザーを検索します。",
            parameters: {
                type: "object",
                properties: {
                    hireYear: {
                        type: "number",
                        description: "入社年",
                    },
                },
                required: ["hireYear"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getChannelMembers",
            description:
                "指定したTeamsのチームとチャネルに所属するユーザーを取得します。",
            parameters: {
                type: "object",
                properties: {
                    teamName: {
                        type: "string",
                        description: "Teamsのチーム名",
                    },
                    channelName: {
                        type: "string",
                        description: "Teamsのチャネル名",
                    },
                },
                required: ["teamName", "channelName"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getUserSchedules",
            description:
                "直前のユーザー検索で取得したユーザーの予定から空いている時間帯を取得します。日時が指定されていない場合は、今日から1か月先まで検索します。",
            parameters: {
                type: "object",
                properties: {
                    startDateTime: {
                        type: "string",
                        description:
                            "予定を検索する開始日時。ISO 8601形式（例: 2026-09-24T00:00:00+09:00）で指定します。日本時間（+09:00）を使用してください。",
                    },
                    endDateTime: {
                        type: "string",
                        description:
                            "予定を検索する終了日時。ISO 8601形式（例: 2026-09-25T00:00:00+09:00）で指定します。日本時間（+09:00）を使用してください。24:00:00は使用せず、日付の終端は翌日の00:00:00で指定してください。",
                    },
                },
                additionalProperties: false,
            },
        },
    },
];