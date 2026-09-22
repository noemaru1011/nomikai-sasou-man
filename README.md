# 🍻 飲み会誘うマン

## 1. 概要

**飲み会誘うマン**は、職場で「飲み会をしたいけど、誰も言い出せない」という状況をAIがサポートする社内向けAIアシスタントです。

上司・部下・他部署の社員など、立場や職場の雰囲気によって「飲みに行きませんか？」と誘いづらい場面があります。

そこで、AIとの個別チャットで

> 「飲み会やりたいです」

と送るだけで、AIがスケジュールや参加者、店舗候補などを整理し、飲み会の企画・提案をサポートします。

最終的な開催判断は人間が行う **Human-in-the-Loop** 方式を採用しています。

## 2. 背景

### ペルソナ

想定する利用者は、以下のような社員です。

* 30代男性社員
* 直属のOJT部下がいる
* 部下は明るく、飲み会にも誘ってみたい
* しかし、現在のご時世や部内の雰囲気から、気軽に誘いづらい
* 自分から誘うことで相手に気を遣わせてしまう可能性もある

このような「誘いたいけれど、言い出しづらい」という状況をAIがサポートします。

## 3. プロジェクト概要

Microsoft Teamsで利用できる社内向けの飲み会日程調整Botです。

ユーザーは、例えば以下のような条件をチャットで指定できます。

* 入社年度
* 部署
* Teamsのグループ
* チャネル
* 参加者
* 日時条件

Botはユーザーからの自然言語による依頼をAIで解釈し、必要に応じて以下の処理を実行します。

1. 対象ユーザーを検索
2. Teamsのチャネルメンバーを取得
3. Microsoft Graphからユーザーの予定を取得
4. 参加者全員が空いている時間帯を検索
5. 検索結果を自然言語で回答

### システム構成

```text
Microsoft Teams
       │
       ▼
   Hono API
       │
       ├── Bot認証
       │
       ▼
    AI Chat
       │
       ├── User検索
       ├── Schedule取得
       └── Available Time検索
       │
       ▼
Microsoft Graph API
```

Cloudflare Workers上で動作するTypeScriptアプリケーションとして構成しています。

---

## 4. 使用技術

| 技術 | 用途 |
| ------------------- | ---------------------------- |
| TypeScript | アプリケーション開発 |
| Cloudflare Workers | APIの実行環境 |
| Hono | HTTP API / Webフレームワーク |
| OpenAI API(orcarouter) | 自然言語処理・Tool Calling |
| Microsoft Graph API | Teams・ユーザー・予定情報の取得 |
| Bot Framework | Microsoft Teams Bot連携 |
| MSAL Node | Microsoft Entra ID認証 |
| Axios | Microsoft Graph API等へのHTTP通信 |
| Wrangler | Cloudflare Workersの開発・デプロイ |

### Axiosについて

Axiosは `1.19.0` を使用しています。

現時点ではAxiosの最新安定版をそのまま使用せず、プロジェクトで必要となる互換性上の理由からバージョンを固定しています。

関連Issue:

[https://github.com/axios/axios/issues/11192](https://github.com/axios/axios/issues/11192)

---

## 5. 主な機能

### 5.1 ユーザー検索

Microsoft Graph APIを利用して、条件に一致するユーザーを検索します。

検索条件には以下があります。

* 部署
* 入社年度
Tool:

```text
searchUsersByDepartment
searchUsersByHireYear
```

---

### 5.2 Teamsチャネルのメンバー取得

指定されたTeamsのチャネルに所属するメンバーを取得します。

Tool:

```text
getChannelMembers
```

チャネルを指定して参加者を取得したい場合に利用します。

---

### 5.3 任意のチャネル、入社年度、部署のメンバー取得

```text
findUsers(AND検索)
```

---

### 5.4 ユーザーの予定取得

Microsoft Graph APIのスケジュール情報を利用して、指定したユーザーの予定を取得します。

Tool:

```text
getUserSchedules
```

日時が明示されていない場合には、Bot側で検索対象期間を設定して予定を検索できます。

---

### 5.5 空き時間検索

取得した参加者の予定から、参加者全員が利用可能な時間帯を検索します。

Tool:

```text
findAvailableTimes
```

例えば、

```text
来週、○○部の人たちで飲み会をしたい
```

のような依頼に対して、対象者の検索から予定確認、空き時間の検索までをAIがTool Callingで実行します。

---

### 5.6 AIによるTool Calling

AIには複数のToolを定義しており、ユーザーの依頼内容に応じて必要なToolを選択します。

```text
ユーザー
  │
  │ 自然言語
  ▼
AI
  │
  ├── findUsers
  ├── getChannelMembers
  ├── getUserSchedules
  └── findAvailableTimes
          │
          ▼
      実際の処理
          │
          ▼
        AI回答
```

Toolの実行処理は `executeTool.ts` に集約しています。

---

## 6. 使い方

Microsoft TeamsのチャットからBotに自然言語で依頼します。

### 入社年度で指定

```text
2024年入社の人たちで飲み会をしたい
```

### 部署で指定

```text
営業部のメンバーで飲み会をしたい
```

### Teamsのチャネルで指定

```text
○○グループの△△チャネルのメンバーで飲み会をしたい
```

### 複数条件を指定

```text
2024年入社で営業部の人たちで飲み会をしたい
```

### 日時条件を指定

```text
来週の平日で全員が空いている時間を探して
```

Botは依頼内容を解析し、必要なユーザー検索・予定取得・空き時間検索を実行します。

---

## 7. ディレクトリ構成

```text
src/
├── ai/
│   ├── chat.ts
│   ├── client.ts
│   ├── executeTool.ts
│   └── tools.ts
│
├── errors/
│   ├── AppError.ts
│   └── onError.ts
│
├── routes/
│   └── bot.ts
│
├── services/
│   └── auth/
│       ├── botAuth.ts
│       └── graphAuth.ts
│
├── tools/
│   ├── findAvailableTimes.ts
│   ├── findUsers.ts
│   ├── getChannelMembers.ts
│   ├── getUserSchedules.ts
│   ├── searchUsersByDepartment.ts
│   └── searchUsersByHireYear.ts
│
├── types/
│   └── index.ts
│
└── index.ts
```

### `ai/`

AIとの通信およびTool Callingを管理します。

| ファイル | 役割 |
| ---------------- | -------------------------- |
| `chat.ts` | AIとのチャット処理・Tool Callingの制御 |
| `client.ts` | OpenAIクライアント生成 |
| `executeTool.ts` | AIから要求されたToolの実行 |
| `tools.ts` | AIに提供するTool定義 |

### `errors/`

アプリケーションのエラー処理を管理します。

| ファイル | 役割 |
| ------------- | -------------- |
| `AppError.ts` | アプリケーション固有のエラー |
| `onError.ts` | Honoのエラーハンドリング |

### `routes/`

HTTP APIのルーティングを管理します。

| ファイル | 役割 |
| -------- | ------------------- |
| `bot.ts` | Teams Botからのリクエスト処理 |

### `services/auth/`

認証処理を管理します。

| ファイル | 役割 |
| -------------- | ----------------------- |
| `botAuth.ts` | Teams Botの認証 |
| `graphAuth.ts` | Microsoft Graph APIへの認証 |

### `tools/`

AIから呼び出される実際の処理を実装します。

| ファイル | 役割 |
| ---------------------------- | --------------- |
| `findUsers.ts` | ユーザー検索(AND検索) |
| `searchUsersByDepartment.ts` | 部署によるユーザー検索 |
| `searchUsersByHireYear.ts` | 入社年度によるユーザー検索 |
| `getChannelMembers.ts` | Teamsチャネルメンバー取得 |
| `getUserSchedules.ts` | ユーザーの予定取得 |
| `findAvailableTimes.ts` | 空き時間検索 |

### `types/`

アプリケーション全体で利用する型を定義します。

---

## 8. セキュリティ

社内のTeams・Microsoft Graph APIと接続するため、APIへのアクセス制御と認証を行っています。

### Teams Botの認証

Teamsから送信されたリクエストについて認証処理を行い、正規のBotリクエストのみを処理します。

認証処理:

```text
services/auth/botAuth.ts
```

---

### Microsoft Graph APIの認証

Microsoft Graph APIへのアクセスにはMicrosoft Entra IDを利用します。

認証処理:

```text
services/auth/graphAuth.ts
```

Graph APIへのアクセスに必要なアクセストークンを取得し、ユーザー情報や予定情報の取得に利用します。

---

### AI Toolの制限

AIには任意のAPIを直接実行させず、アプリケーション側で定義したToolのみを実行可能にしています。

```text
AI
 │
 ├─ Tool A
 ├─ Tool B
 ├─ Tool C
 └─ Tool D
      │
      ▼
executeTool.ts
      │
      ▼
実装済みの処理のみ実行
```

これにより、AIが自由にHTTPリクエストを生成して外部APIを呼び出す構成にはしていません。

---

### プロンプトインジェクション対策

ユーザーから入力された内容は信頼できない入力として扱います。

AIへのシステム指示とユーザー入力を分離し、ユーザー入力によってシステム側のルールやToolの利用目的が変更されないようにします。(orcarouter内)

また、Toolに渡される引数についてもアプリケーション側で処理を行い、AIの出力をそのまま信頼して外部APIを実行する構成にはしません。

---

### エラーハンドリング

アプリケーション固有のエラーは `AppError` で管理します。

```text
errors/
├── AppError.ts
└── onError.ts
```

エラー処理を集約することで、内部的なエラー情報や認証情報などがそのままクライアントへ返却されることを防ぎます。

---

## 9. 開発

### 開発サーバー起動

```bash
npm install
npm run dev
```

### デプロイ

```bash
npm run deploy
```

### Cloudflare Workersの型生成

```bash
npm run cf-typegen
```

---

## 10. 処理の流れ

```text
Teams
  │
  │ メッセージ
  ▼
Hono
  │
  ├── Bot認証
  │
  ▼
AI Chat
  │
  │ Tool Calling
  ▼
executeTool
  │
  ├── findUsers
  ├── searchUsersByDepartment
  ├── searchUsersByHireYear
  ├── getChannelMembers
  └── getUserSchedules
          │
          ▼
   findAvailableTimes
          │
          ▼
       AI Chat
          │
          ▼
       Teamsへ回答
```

## 11.画面キャプチャ

### チャネル指定

![チャネル指定](docs/チャネル.png)

### 入社年度指定

![入社年度指定](docs/年度.png)

### 部署指定

![部署指定](docs/部署.png)

### プロンプトインジェクション対策

![プロンプトインジェクション対策](docs/プロンプトインジェクション.png)
