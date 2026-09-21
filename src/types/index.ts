export type Bindings = {
    CLIENT_ID: string;
    TENANT_ID: string;
    CLIENT_SECRET: string;
};

export type Activity = {
    type: string;
    serviceUrl: string;
    conversation: {
        id: string;
    };
    replyToId: string;
    from?: {
        id?: string;
        name?: string;
        aadObjectId?: string;
    };
};
export type AppEnv = {
    Bindings: Bindings;
    Variables: {
        activity: Activity;
    };
};