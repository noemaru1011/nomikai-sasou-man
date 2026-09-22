import OpenAI from "openai";

export function createOrcaRouterClient(apiKey: string): OpenAI {
    return new OpenAI({
        apiKey,
        baseURL: "https://api.orcarouter.ai/v1",
    });
}