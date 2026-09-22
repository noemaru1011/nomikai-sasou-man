import type { ScheduleItem } from "@microsoft/microsoft-graph-types";

import type { UserSchedules } from "./getUserSchedules";

const NOMIKAI_DURATION_MINUTES = 120;
const NOMIKAI_START_HOUR = 18;
const NOMIKAI_END_HOUR = 24;
const CANDIDATE_INTERVAL_MINUTES = 30;

export type AvailableTime = {
    startDateTime: string;
    endDateTime: string;
};

export function findAvailableTimes(
    userSchedules: UserSchedules,
): AvailableTime[] {
    const searchStart = new Date(userSchedules.startDateTime);
    const searchEnd = new Date(userSchedules.endDateTime);

    const userAvailablePeriods = [
        ...userSchedules.schedules.values(),
    ].map((schedules) =>
        findUserAvailablePeriods(
            schedules,
            searchStart,
            searchEnd,
        ),
    );

    if (userAvailablePeriods.length === 0) {
        return [];
    }

    return intersectAvailablePeriods(userAvailablePeriods);
}

function findUserAvailablePeriods(
    schedules: ScheduleItem[],
    searchStart: Date,
    searchEnd: Date,
): AvailableTime[] {
    const availablePeriods: AvailableTime[] = [];

    let currentDate = getJstMidnight(searchStart);

    while (currentDate < searchEnd) {
        const eveningStart = createJstDateTime(
            currentDate,
            NOMIKAI_START_HOUR,
            0,
        );

        const eveningEnd = createJstDateTime(
            currentDate,
            NOMIKAI_END_HOUR,
            0,
        );

        const periodStart =
            eveningStart < searchStart ? searchStart : eveningStart;

        const periodEnd =
            eveningEnd > searchEnd ? searchEnd : eveningEnd;

        if (periodStart < periodEnd) {
            availablePeriods.push(
                ...findAvailablePeriod(
                    schedules,
                    periodStart,
                    periodEnd,
                ),
            );
        }

        currentDate = new Date(
            currentDate.getTime() + 24 * 60 * 60 * 1000,
        );
    }

    return availablePeriods;
}

function findAvailablePeriod(
    schedules: ScheduleItem[],
    searchStart: Date,
    searchEnd: Date,
): AvailableTime[] {
    const busyPeriods = schedules
        .filter(
            (schedule) =>
                schedule.start?.dateTime !== undefined &&
                schedule.end?.dateTime !== undefined,
        )
        .map((schedule) => ({
            start: new Date(schedule.start!.dateTime!),
            end: new Date(schedule.end!.dateTime!),
        }))
        .filter(
            (period) =>
                period.start < searchEnd &&
                period.end > searchStart,
        )
        .map((period) => ({
            start:
                period.start < searchStart
                    ? searchStart
                    : period.start,
            end:
                period.end > searchEnd
                    ? searchEnd
                    : period.end,
        }))
        .sort(
            (a, b) =>
                a.start.getTime() - b.start.getTime(),
        );

    const mergedBusyPeriods = mergeBusyPeriods(busyPeriods);
    const availablePeriods: AvailableTime[] = [];

    let current = searchStart;

    for (const busyPeriod of mergedBusyPeriods) {
        if (current < busyPeriod.start) {
            availablePeriods.push({
                startDateTime: current.toISOString(),
                endDateTime: busyPeriod.start.toISOString(),
            });
        }

        if (busyPeriod.end > current) {
            current = busyPeriod.end;
        }
    }

    if (current < searchEnd) {
        availablePeriods.push({
            startDateTime: current.toISOString(),
            endDateTime: searchEnd.toISOString(),
        });
    }

    return availablePeriods;
}

function mergeBusyPeriods(
    periods: { start: Date; end: Date }[],
): { start: Date; end: Date }[] {
    const mergedPeriods: { start: Date; end: Date }[] = [];

    for (const period of periods) {
        const last = mergedPeriods.at(-1);

        if (
            last === undefined ||
            period.start > last.end
        ) {
            mergedPeriods.push({
                start: period.start,
                end: period.end,
            });
            continue;
        }

        if (period.end > last.end) {
            last.end = period.end;
        }
    }

    return mergedPeriods;
}

function intersectAvailablePeriods(
    userAvailablePeriods: AvailableTime[][],
): AvailableTime[] {
    let commonPeriods = userAvailablePeriods[0] ?? [];

    for (const availablePeriods of userAvailablePeriods.slice(1)) {
        commonPeriods = intersectTwoPeriods(
            commonPeriods,
            availablePeriods,
        );
    }

    return commonPeriods.flatMap((period) => {
        const start = new Date(period.startDateTime);
        const end = new Date(period.endDateTime);

        if (
            end.getTime() - start.getTime() <
            NOMIKAI_DURATION_MINUTES * 60 * 1000
        ) {
            return [];
        }

        const result: AvailableTime[] = [];
        let current = start;

        while (
            current.getTime() +
            NOMIKAI_DURATION_MINUTES * 60 * 1000 <=
            end.getTime()
        ) {
            const candidateEnd = new Date(
                current.getTime() +
                NOMIKAI_DURATION_MINUTES * 60 * 1000,
            );

            result.push({
                startDateTime: current.toISOString(),
                endDateTime: candidateEnd.toISOString(),
            });

            current = new Date(
                current.getTime() +
                CANDIDATE_INTERVAL_MINUTES * 60 * 1000,
            );
        }

        return result;
    });
}

function intersectTwoPeriods(
    first: AvailableTime[],
    second: AvailableTime[],
): AvailableTime[] {
    const result: AvailableTime[] = [];

    for (const firstPeriod of first) {
        for (const secondPeriod of second) {
            const start = new Date(
                Math.max(
                    new Date(firstPeriod.startDateTime).getTime(),
                    new Date(secondPeriod.startDateTime).getTime(),
                ),
            );

            const end = new Date(
                Math.min(
                    new Date(firstPeriod.endDateTime).getTime(),
                    new Date(secondPeriod.endDateTime).getTime(),
                ),
            );

            if (start < end) {
                result.push({
                    startDateTime: start.toISOString(),
                    endDateTime: end.toISOString(),
                });
            }
        }
    }

    return mergeAvailablePeriods(result);
}

function mergeAvailablePeriods(
    periods: AvailableTime[],
): AvailableTime[] {
    const sortedPeriods = [...periods].sort(
        (a, b) =>
            new Date(a.startDateTime).getTime() -
            new Date(b.startDateTime).getTime(),
    );

    const mergedPeriods: AvailableTime[] = [];

    for (const period of sortedPeriods) {
        const last = mergedPeriods.at(-1);

        if (
            last === undefined ||
            new Date(period.startDateTime).getTime() >
            new Date(last.endDateTime).getTime()
        ) {
            mergedPeriods.push({ ...period });
            continue;
        }

        if (
            new Date(period.endDateTime).getTime() >
            new Date(last.endDateTime).getTime()
        ) {
            last.endDateTime = period.endDateTime;
        }
    }

    return mergedPeriods;
}

function getJstMidnight(date: Date): Date {
    const jstDate = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

    return new Date(`${jstDate}T00:00:00+09:00`);
}

function createJstDateTime(
    date: Date,
    hour: number,
    minute: number,
): Date {
    const jstDate = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

    if (hour === 24) {
        const nextDay = new Date(`${jstDate}T00:00:00+09:00`);

        return new Date(
            nextDay.getTime() + 24 * 60 * 60 * 1000,
        );
    }

    return new Date(
        `${jstDate}T${String(hour).padStart(2, "0")}:${String(
            minute,
        ).padStart(2, "0")}:00+09:00`,
    );
}