# Tool一覧

| Tool                      | 入力                                                          | 出力              |
| ------------------------- | ------------------------------------------------------------- | ----------------- |
| `searchUsersByHireYear`   | `graphAccessToken`, `hireYear`                                | `User[]`          |
| `searchUsersByDepartment` | `graphAccessToken`, `department`                              | `User[]`          |
| `getUserSchedules`        | `graphAccessToken`, `userIds`, `startDateTime`, `endDateTime` | `UserSchedules`   |
| `getChannelMembers`       | `graphAccessToken`, `teamName`, `channelName`                 | `User[]`          |
| `findUsers`               | `graphAccessToken`, `options`                                 | `User[]`          |
| `findAvailableTimes`      | `userSchedules`                                               | `AvailableTime[]` |

---

## `searchUsersByHireYear`

```ts
export async function searchUsersByHireYear(
    graphAccessToken: string,
    hireYear: number,
): Promise<User[]>

```

### `searchUsersByHireYear` の Input

| 名前 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `graphAccessToken` | `string` | Yes | Microsoft Graphのアクセストークン |
| `hireYear` | `number` | Yes | 入社年 |

### `searchUsersByHireYear` の Output

```ts
Promise<User[]>

```

---

## `searchUsersByDepartment`

```ts
export async function searchUsersByDepartment(
    graphAccessToken: string,
    department: string,
): Promise<User[]>

```

### `searchUsersByDepartment` の Input

| 名前 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `graphAccessToken` | `string` | Yes | Microsoft Graphのアクセストークン |
| `department` | `string` | Yes | 部署名 |

### `searchUsersByDepartment` の Output

```ts
Promise<User[]>

```

---

## `getUserSchedules`

提示いただいた返却型：

```ts
export type UserSchedules = {
    startDateTime: string;
    endDateTime: string;
    schedules: Map<string, ScheduleItem[]>;
};

```

### `getUserSchedules` の Input

関数シグネチャは今回の提示には含まれていないため、**ここは推測せず、実際のシグネチャが必要です。**

### `getUserSchedules` の Output

```ts
UserSchedules

```

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `startDateTime` | `string` | 予定取得範囲の開始日時 |
| `endDateTime` | `string` | 予定取得範囲の終了日時 |
| `schedules` | `Map<string, ScheduleItem[]>` | ユーザーIDごとの予定一覧 |

---

## `getChannelMembers`

```ts
export async function getChannelMembers(
    graphAccessToken: string,
    teamName: string,
    channelName: string,
): Promise<User[]>

```

### `getChannelMembers` の Input

| 名前 | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `graphAccessToken` | `string` | Yes | Microsoft Graphのアクセストークン |
| `teamName` | `string` | Yes | Teamsのチーム名 |
| `channelName` | `string` | Yes | Teamsのチャネル名 |

### `getChannelMembers` の Output

```ts
Promise<User[]>

```

---

## `findUsers`

```ts
type FindUsersOptions = {
    department?: string;
    hireYear?: number;
    teamName?: string;
    channelName?: string;
};

export async function findUsers(
    graphAccessToken: string,
    options: FindUsersOptions,
): Promise<User[]>

```

### `findUsers` の Input

#### `graphAccessToken` (findUsers)

```ts
string

```

Microsoft Graphのアクセストークン。

#### `options` (findUsers)

```ts
type FindUsersOptions = {
    department?: string;
    hireYear?: number;
    teamName?: string;
    channelName?: string;
};

```

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `department` | `string` | No | 部署名 |
| `hireYear` | `number` | No | 入社年 |
| `teamName` | `string` | No | Teamsのチーム名 |
| `channelName` | `string` | No | Teamsのチャネル名 |

### `findUsers` の Output

```ts
Promise<User[]>

```

---

## `findAvailableTimes`

```ts
export function findAvailableTimes(
    userSchedules: UserSchedules,
): AvailableTime[]

```

### `findAvailableTimes` の Input

```ts
UserSchedules

```

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `startDateTime` | `string` | 検索対象期間の開始日時 |
| `endDateTime` | `string` | 検索対象期間の終了日時 |
| `schedules` | `Map<string, ScheduleItem[]>` | ユーザーごとの予定 |

### `findAvailableTimes` の Output

```ts
AvailableTime[]

```

```ts
export type AvailableTime = {
    startDateTime: string;
    endDateTime: string;
};

```

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `startDateTime` | `string` | 空き時間の開始日時 |
| `endDateTime` | `string` | 空き時間の終了日時 |

---

## 全体の依存関係

今回の6つは、単純に横並びではなく、こういう関係です。

```text
                ┌─ searchUsersByDepartment ─┐
                │                           │
                ├─ searchUsersByHireYear ───┤
                │                           ↓
                ├─ getChannelMembers ──── User[]
                │                           │
                └─ findUsers ───────────────┘
                                            │
                                            ↓
                                 getUserSchedules
                                            │
                                            ↓
                                     UserSchedules
                                            │
                                            ↓
                                findAvailableTimes
                                            │
                                            ↓
                                     AvailableTime[]

```

また、`findUsers` は既存の検索系toolをまとめた**上位のユーザー検索tool**という位置付けですね。

```text
findUsers
├── department
├── hireYear
├── teamName
└── channelName

```
