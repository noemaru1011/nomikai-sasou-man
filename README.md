```txt
npm install
npm run dev
```
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

## 想定技術スタック

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

### ファイル

書くファイルをリスト化
1.indexファイル
2.ルーティング(Request Responseの責任)
3.ミドルウェア(認証認可やる場所)
4.ルーティング先の関数たち
    - TeamsのSDK(予定表)
    - AI(オルカルーター やりながら)
    - TeamsのSDK(予定表追加)

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