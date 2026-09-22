import axios from "axios";
import type {
    ScheduleItem,
    User,
} from "@microsoft/microsoft-graph-types";

type GraphCollection<T> = {
    value: T[];
};

export type UserSchedules = {
    startDateTime: string;
    endDateTime: string;
    schedules: Map<string, ScheduleItem[]>;
};

export async function getUserSchedules(
    graphAccessToken: string,
    users: User[],
    startDateTime?: string,
    endDateTime?: string,
): Promise<UserSchedules> {
    const start = startDateTime ?? getTodayStart();
    const end = endDateTime ?? getOneMonthLater();

    const response = await Promise.all(
        users.map(async (user) => {
            if (!user.id) {
                return null;
            }

            const result = await axios.get<GraphCollection<ScheduleItem>>(
                `https://graph.microsoft.com/v1.0/users/${user.id}/calendarView`,
                {
                    headers: {
                        Authorization: `Bearer ${graphAccessToken}`,
                        Prefer: 'outlook.timezone="Tokyo Standard Time"',
                    },
                    params: {
                        startDateTime: start,
                        endDateTime: end,
                        $select: "id,subject,start,end,isAllDay",
                        $orderby: "start/dateTime",
                    },
                },
            );

            return {
                userId: user.id,
                schedules: result.data.value,
            };
        }),
    );

    return {
        startDateTime: start,
        endDateTime: end,
        schedules: new Map(
            response
                .filter((result) => result !== null)
                .map((result) => [result.userId, result.schedules]),
        ),
    };
}

function getTodayStart(): string {
    const now = new Date();

    return `${formatJstDate(now)}T00:00:00+09:00`;
}

function getOneMonthLater(): string {
    const now = new Date();

    const jstDate = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);

    const [year, month, day] = jstDate.split("-").map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day),
    );

    date.setUTCMonth(date.getUTCMonth() + 1);

    return `${formatJstDate(date)}T00:00:00+09:00`;
}

function formatJstDate(date: Date): string {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}