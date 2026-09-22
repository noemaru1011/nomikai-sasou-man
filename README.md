# 飲み会誘うマン

## コンセプト

幹事の労力が少ない飲み会

## 目的

- 上司も部下もお互い誘いづらい
- 飲み会誘ってくれるマン
- 何時からどこで、飲み会どうですか
- 暇そうな他部署もわかる
- 言い出す人がいない
- よく行く人を判断する→新人や積極的な人(参加頻度、返信速度、！とか)を優先するアルゴリズム

## ペルソナ分析

- 30代男性社員
- 直属のOJT部下がいますが、明るい子なので飲み会に誘いたい
- しかし、ご時世や部の環境的に誘いづらい
- そんなときに「飲み会誘うマン」の出番

チャネルの中でしゃべるbot
○○しますか？だと選択の負荷などがかかる
→「この日この場所で開催します」ってAIがしゃべりだす
→→誰かが飲み会したい旨を伝えるのがトリガー（形骸化対策、トリガーは個チャ）
→→優先されるべき人（上記のアルゴリズム参照）の予定を優先して開催、言い出しっぺは絶対予定が空いている

## ユースケース

1. AIとの個チャで「飲み会やりたいです」って旨を送信
2. AIとの個チャでAIが候補を送るので人が判断(ヒューマンインザループ)
    - スケジュール
    - 場所(店　優先候補1,2,3)
    - 価格帯 AIが正しい判断してくれる?
    - チャネルに送るメッセージ
3. AIとの個チャで「確定（１つ）」と送信
4. AIと部署の人間がいるチャネルにAIが「この日この場所で開催します」と提案
5. そのメッセージに○○以上のリアクション、(提案した人が予約すまっせ)

※店が開いてなかったとき
→第3候補までなら空いてるっしょ

### ファイル

書くファイルをリスト化
1.indexファイル
2.ルーティング(Request Responseの責任)
3.ミドルウェア(認証認可やる場所)
4.ルーティング先の関数たち
    - TeamsのSDK(予定表)
    - AI(オルカルーター やりながら)
    - TeamsのSDK(予定表追加)

① Graph API単体
   └─ 今ここまで完了

② Teams Bot
   └─ 「飲み会したい」を受信

③ Teams SSO
   └─ Botを使っているAさんを特定

④ Hono
   └─ AさんのTokenを使ってGraph API

⑤ Graph
   └─ Aさんの予定取得

⑥ 複数ユーザー
   └─ B/C/Dの予定取得方法・権限を検討

⑦ 飲み会候補日時を計算

⑧ BotからTeamsへ返信

メモ

```ts
import { Hono } from "hono";

type Bindings = {
  CLIENT_ID: string;
  TENANT_ID: string;
  CLIENT_SECRET:string
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Graph API Demo");
});

app.get("/auth/login", (c) => {
  const clientId = c.env.CLIENT_ID;
  const tenantId = c.env.TENANT_ID;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: "http://localhost:8787/auth/callback",
    response_mode: "query",
    scope: "openid profile User.Read Calendars.Read",
  });

  const authUrl =
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  return c.redirect(authUrl);
});

app.get("/auth/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.text("Authorization code not found", 400);
  }

  const tokenUrl =
    `https://login.microsoftonline.com/${c.env.TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: c.env.CLIENT_ID,
    client_secret: c.env.CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: "http://localhost:8787/auth/callback",
  });

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

const tokenResult = (await tokenResponse.json()) as {
  access_token?: string;
  error?: string;
  error_description?: string;
};

  if (!tokenResponse.ok || !tokenResult.access_token) {
    return c.json(tokenResult, 400);
  }

  const graphResponse = await fetch(
    "https://graph.microsoft.com/v1.0/me/calendar/events",
    {
      headers: {
        Authorization: `Bearer ${tokenResult.access_token}`,
      },
    },
  );

  const graphResult = await graphResponse.json();

  if (!graphResponse.ok) {
    return c.json(graphResult, 400);
  }

  return c.json(graphResult);
});

export default app;
```

<<<<<<< HEAD
```ts
{
    startDateTime: "2026-09-22T00:00:00+09:00",
    endDateTime: "2026-10-22T00:00:00+09:00",
    schedules: Map([
        ["田中太郎のユーザーID", [予定1, 予定2]],
        ["佐藤花子のユーザーID", [予定1]],
        ["高橋翔太のユーザーID", []],
        ["伊藤美咲のユーザーID", [予定1, 予定2]]
    ])
}
```
=======
### アーキテクチャ
Teams
  │
  │ 「予定教えて」、Botに個別メッセージを送る→トリガーになる→アクションでHTTPリクエストをアプリサーバに送る(URL指定)
  ↓
Hono
  │
  │ fetch()
  ↓
Microsoft Graph　API
  │
  │ /me/calendar/events
  ↓
予定表
  │
  ↓
Hono
  │
  ↓
Orca Router
  │
  ↓
Hono
  │Bot Framework REST API
  ↓
Teamsへ返信
>>>>>>> fd799b75956022a5c43f8b71d343e542a26178f2
