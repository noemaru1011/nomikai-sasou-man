import type { User } from "@microsoft/microsoft-graph-types";

import { getChannelMembers } from "./getChannelMembers";
import { searchUsersByDepartment } from "./searchUsersByDepartment";
import { searchUsersByHireYear } from "./searchUsersByHireYear";

type FindUsersOptions = {
    department?: string;
    hireYear?: number;
    teamName?: string;
    channelName?: string;
};

export async function findUsers(
    graphAccessToken: string,
    options: FindUsersOptions,
): Promise<User[]> {
    const { department, hireYear, teamName, channelName } = options;

    if (teamName !== undefined && channelName === undefined) {
        throw new Error(
            "channelNameを指定する場合はteamNameも指定してください",
        );
    }

    if (channelName !== undefined && teamName === undefined) {
        throw new Error(
            "teamNameを指定する場合はchannelNameも指定してください",
        );
    }

    const userSets: User[][] = [];

    // 部署
    if (department !== undefined) {
        const users = await searchUsersByDepartment(
            graphAccessToken,
            department,
        );

        userSets.push(users);
    }

    // 入社年度
    if (hireYear !== undefined) {
        const users = await searchUsersByHireYear(
            graphAccessToken,
            hireYear,
        );

        userSets.push(users);
    }

    // チャネル
    if (teamName !== undefined && channelName !== undefined) {
        const users = await getChannelMembers(
            graphAccessToken,
            teamName,
            channelName,
        );

        userSets.push(users);
    }

    if (userSets.length === 0) {
        throw new Error("検索条件を1つ以上指定してください");
    }

    return intersectUsers(userSets);
}

function intersectUsers(userSets: User[][]): User[] {
    const [first, ...rest] = userSets;

    if (first === undefined) {
        return [];
    }

    const otherUserIds = rest.map(
        (users) =>
            new Set(
                users
                    .map((user) => user.id)
                    .filter((id): id is string => id !== undefined),
            ),
    );

    return first.filter((user) => {
        const userId = user.id;

        if (userId === undefined) {
            return false;
        }

        return otherUserIds.every((userIds) => userIds.has(userId));
    });
}