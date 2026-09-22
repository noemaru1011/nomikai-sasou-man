import axios from "axios";
import type {
    AadUserConversationMember,
    Channel,
    Team,
    User,
} from "@microsoft/microsoft-graph-types";

type GraphCollection<T> = {
    value: T[];
};

export async function getChannelMembers(
    graphAccessToken: string,
    teamName: string,
    channelName: string,
): Promise<User[]> {
    const headers = {
        Authorization: `Bearer ${graphAccessToken}`,
    };

    // チーム一覧を取得
    const teamsResponse = await axios.get<GraphCollection<Team>>(
        "https://graph.microsoft.com/v1.0/teams",
        {
            headers,
        },
    );

    // チーム名から対象チームを取得
    const team = teamsResponse.data.value.find(
        (team) => team.displayName === teamName,
    );

    if (!team?.id) {
        throw new Error(`チームが見つかりません: ${teamName}`);
    }

    // チーム内のチャネル一覧を取得
    const channelsResponse = await axios.get<GraphCollection<Channel>>(
        `https://graph.microsoft.com/v1.0/teams/${team.id}/channels`,
        {
            headers,
        },
    );

    // チャネル名から対象チャネルを取得
    const channel = channelsResponse.data.value.find(
        (channel) => channel.displayName === channelName,
    );

    if (!channel?.id) {
        throw new Error(
            `チャネルが見つかりません: ${teamName} / ${channelName}`,
        );
    }

    // チャネルのメンバーを取得
    const membersResponse = await axios.get<
        GraphCollection<AadUserConversationMember>
    >(
        `https://graph.microsoft.com/v1.0/teams/${team.id}/channels/${channel.id}/members`,
        {
            headers,
        },
    );

    const users = await Promise.all(
        membersResponse.data.value.map(async (member) => {
            if (!member.userId) {
                return undefined;
            }

            const userResponse = await axios.get<User>(
                `https://graph.microsoft.com/v1.0/users/${member.userId}`,
                {
                    headers,
                    params: {
                        $select:
                            "id,displayName,mail,userPrincipalName,department,employeeHireDate",
                    },
                },
            );

            return userResponse.data;
        }),
    );

    return users.filter((user): user is User => user !== undefined);
}