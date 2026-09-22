import type { User } from "@microsoft/microsoft-graph-types";

import { findAvailableTimes } from "../tools/findAvailableTimes";
import { findUsers } from "../tools/findUsers";
import { getChannelMembers } from "../tools/getChannelMembers";
import { getUserSchedules } from "../tools/getUserSchedules";
import { searchUsersByDepartment } from "../tools/searchUsersByDepartment";
import { searchUsersByHireYear } from "../tools/searchUsersByHireYear";

export type ToolContext = {
    graphAccessToken: string;
    users?: User[];
};

type FindUsersArguments = {
    department?: string;
    hireYear?: number;
    teamName?: string;
    channelName?: string;
};

type SearchUsersByDepartmentArguments = {
    department: string;
};

type SearchUsersByHireYearArguments = {
    hireYear: number;
};

type GetChannelMembersArguments = {
    teamName: string;
    channelName: string;
};

type GetUserSchedulesArguments = {
    startDateTime?: string;
    endDateTime?: string;
};

export async function executeTool(
    toolName: string,
    arguments_: unknown,
    context: ToolContext,
): Promise<unknown> {
    console.log("executeTool:", toolName);

    switch (toolName) {
        case "findUsers": {
            const args = arguments_ as FindUsersArguments;
            console.log("findUsers arguments:", args);

            const users = await findUsers(
                context.graphAccessToken,
                args,
            );

            console.log("findUsers result:", users);
            context.users = users;

            return users;
        }

        case "searchUsersByDepartment": {
            const args =
                arguments_ as SearchUsersByDepartmentArguments;

            console.log(
                "searchUsersByDepartment arguments:",
                args,
            );

            const users = await searchUsersByDepartment(
                context.graphAccessToken,
                args.department,
            );

            console.log(
                "searchUsersByDepartment result:",
                users,
            );

            context.users = users;

            return users;
        }

        case "searchUsersByHireYear": {
            const args =
                arguments_ as SearchUsersByHireYearArguments;

            console.log(
                "searchUsersByHireYear arguments:",
                args,
            );

            const users = await searchUsersByHireYear(
                context.graphAccessToken,
                args.hireYear,
            );

            console.log(
                "searchUsersByHireYear result:",
                users,
            );

            context.users = users;

            return users;
        }

        case "getChannelMembers": {
            const args =
                arguments_ as GetChannelMembersArguments;

            console.log(
                "getChannelMembers arguments:",
                args,
            );

            const users = await getChannelMembers(
                context.graphAccessToken,
                args.teamName,
                args.channelName,
            );

            console.log(
                "getChannelMembers result:",
                users,
            );

            context.users = users;

            return users;
        }

        case "getUserSchedules": {
            console.log(
                "getUserSchedules arguments:",
                arguments_,
            );

            if (!context.users) {
                throw new Error(
                    "getUserSchedulesを実行する前にユーザー検索が必要です。",
                );
            }

            console.log(
                "getUserSchedules users:",
                context.users,
            );

            const args =
                arguments_ as GetUserSchedulesArguments;

            console.log(
                "Calling Graph getUserSchedules...",
            );

            const userSchedules = await getUserSchedules(
                context.graphAccessToken,
                context.users,
                args.startDateTime,
                args.endDateTime,
            );

            console.log(
                "Graph getUserSchedules completed:",
                userSchedules,
            );

            const availableTimes =
                findAvailableTimes(userSchedules);

            console.log(
                "findAvailableTimes completed:",
                availableTimes,
            );

            const limitedAvailableTimes =
                availableTimes.slice(0, 20);

            console.log(
                "Available times returned to AI:",
                limitedAvailableTimes,
            );

            return limitedAvailableTimes;
        }

        default:
            throw new Error(
                `Unknown tool: ${toolName}`,
            );
    }
}