import axios from "axios";

import type { Bindings } from "../types";

type TokenResponse = {
    access_token: string;
};

export async function getBotAccessToken(
    env: Bindings,
): Promise<string> {
    try {
        const response = await axios.post<TokenResponse>(
            `https://login.microsoftonline.com/${env.TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: env.CLIENT_ID,
                client_secret: env.CLIENT_SECRET,
                scope: "https://api.botframework.com/.default",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
        );

        return response.data.access_token;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Failed to get Bot access token:", {
                status: error.response?.status,
                body: error.response?.data,
            });
        } else {
            console.error("Failed to get Bot access token:", error);
        }

        throw new Error("Failed to get Bot access token");
    }
}