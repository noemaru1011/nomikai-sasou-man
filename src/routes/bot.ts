import axios from "axios";
import { Hono } from "hono";

import { getBotAccessToken } from "../services/auth/botAuth";
import { getGraphAccessToken } from "../services/auth/graphAuth";
import { findAvailableTimes } from "../tools/findAvailableTimes";
import { findUsers } from "../tools/findUsers";
import { getUserSchedules } from "../tools/getUserSchedules";
import type { AppEnv } from "../types";

const bot = new Hono<AppEnv>();

bot.post("/messages", async (c) => {
  const activity = await c.req.json<AppEnv["Variables"]["activity"]>();

  c.set("activity", activity);

  const botAccessToken = await getBotAccessToken(c.env);
  const graphAccessToken = await getGraphAccessToken(c.env);

  const users = await findUsers(
    graphAccessToken,
    {
      department: "IT部",
    },
  );

  console.log("Users:", users);

  const userSchedules = await getUserSchedules(
    graphAccessToken,
    users,
  );

  console.log("User schedules:", userSchedules);

  const availableTimes = findAvailableTimes(userSchedules);

  console.log("Available times:", availableTimes);

  const groupedAvailableTimes =
    groupAvailableTimesByDate(availableTimes);

  const availableTimeText =
    Object.entries(groupedAvailableTimes)
      .map(
        ([date, times]) =>
          [
            date,
            ...times.map(
              (time) =>
                `${time.start} - ${time.end}`,
            ),
          ].join("\n"),
      )
      .join("\n\n");

  const text =
    users.length === 0
      ? "参加者が見つかりませんでした。"
      : [
        "【参加者】",
        ...users.map(
          (user) => user.displayName ?? "名前なし",
        ),
        "",
        "【飲み会候補】",
        availableTimeText,
      ].join("\n");

  await axios.post(
    `${activity.serviceUrl}/v3/conversations/${activity.conversation.id}/activities/${activity.replyToId}`,
    {
      type: "message",
      text,
    },
    {
      headers: {
        Authorization: `Bearer ${botAccessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return c.json({});
});

type DisplayAvailableTime = {
  start: string;
  end: string;
};

function groupAvailableTimesByDate(
  availableTimes: {
    startDateTime: string;
    endDateTime: string;
  }[],
): Record<string, DisplayAvailableTime[]> {
  const grouped: Record<
    string,
    DisplayAvailableTime[]
  > = {};

  for (const time of availableTimes) {
    const start = formatJstDateTime(
      time.startDateTime,
    );
    const end = formatJstDateTime(
      time.endDateTime,
    );

    const date = start.date;

    grouped[date] ??= [];

    grouped[date].push({
      start: start.time,
      end: end.time,
    });
  }

  return grouped;
}

function formatJstDateTime(dateTime: string): {
  date: string;
  time: string;
} {
  const date = new Date(dateTime);

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  const hour = parts.find(
    (part) => part.type === "hour",
  )?.value;

  const minute = parts.find(
    (part) => part.type === "minute",
  )?.value;

  if (
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    throw new Error("日時の変換に失敗しました");
  }

  return {
    date: `${month}/${day}`,
    time: `${hour}:${minute}`,
  };
}

export default bot;
