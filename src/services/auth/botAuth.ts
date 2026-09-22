import axios from "axios";

import type { Bindings } from "../../types";

type TokenResponse = {
    access_token: string;
};

export async function getBotAccessToken(
    env: Bindings,
): Promise<string> {
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
}