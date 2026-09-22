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

    switch (toolName) {
        case "findUsers": {
            const args = arguments_ as FindUsersArguments;

            const users = await findUsers(
                context.graphAccessToken,
                args,
            );

            context.users = users;

            return users;
        }

        case "searchUsersByDepartment": {
            const args =
                arguments_ as SearchUsersByDepartmentArguments;

            const users = await searchUsersByDepartment(
                context.graphAccessToken,
                args.department,
            );


            context.users = users;

            return users;
        }

        case "searchUsersByHireYear": {
            const args =
                arguments_ as SearchUsersByHireYearArguments;


            const users = await searchUsersByHireYear(
                context.graphAccessToken,
                args.hireYear,
            );


            context.users = users;

            return users;
        }

        case "getChannelMembers": {
            const args =
                arguments_ as GetChannelMembersArguments;


            const users = await getChannelMembers(
                context.graphAccessToken,
                args.teamName,
                args.channelName,
            );

            context.users = users;

            return users;
        }

        case "getUserSchedules": {


            if (!context.users) {
                throw new Error(
                    "getUserSchedulesを実行する前にユーザー検索が必要です。",
                );
            }

            const args =
                arguments_ as GetUserSchedulesArguments;

            const userSchedules = await getUserSchedules(
                context.graphAccessToken,
                context.users,
                args.startDateTime,
                args.endDateTime,
            );


            const availableTimes =
                findAvailableTimes(userSchedules);


            const limitedAvailableTimes =
                availableTimes.slice(0, 20);


            return limitedAvailableTimes;
        }

        default:
            throw new Error(
                `Unknown tool: ${toolName}`,
            );
    }
}