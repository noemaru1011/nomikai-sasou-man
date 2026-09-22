import type { Activity } from "botbuilder";

export type Bindings = {
    CLIENT_ID: string;
    TENANT_ID: string;
    CLIENT_SECRET: string;
};

export type AppEnv = {
    Bindings: Bindings;
    Variables: {
        activity: Activity;
    };
};