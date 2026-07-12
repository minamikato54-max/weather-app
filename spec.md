# weather-app 仕様書

作成日: 2026-07-12
ステータス: 壁打ち完了・仕様確定、実装フェーズ着手

## 背景・経緯

- プログラミング講習の一環として「外部APIを叩いてデータを取得し、画面に表示する」基本セットを身につけるための学習用アプリ。
- 直近の [[todo-app-nextjs]] と同じ Next.js + Firebase 構成を踏襲しつつ、今回は「サーバー側でAPIキーを隠すAPI Routesの書き方」も学習範囲に含める。

---

## 機能要件

### 必須要件（ユーザー指定の大元の要望）
- 任意の都市 or 現在地の気温・天気・湿度・降水確率などを表示
- カレンダー機能で日付を選んで予報を切り替えられる（週間予報の中から該当日を表示でもOK）
- APIキーは必ず環境変数（`.env.local`）で管理。コードに直書きしない
- GitHubにリポジトリ作成 + Vercelにデプロイ（環境変数もVercel側で設定）

### 壁打ちで確定した追加要件

| 項目 | 内容 |
|---|---|
| 都市指定 | テキスト入力での都市名検索、および現在地取得（Geolocation API）ボタンの両方 |
| 日付切り替えUI | シンプルな日付ボタン列（今日〜4日後の5つ）。OpenWeatherMap無料枠の制約上、選べる日付は最大5日分 |
| 表示項目 | 気温（現在/最高/最低）・体感温度・天気（アイコン+説明）・湿度・降水確率・風速・日の出/日の入り時刻 |
| 背景演出 | 天気（晴れ/雨/曇り等）に応じてページの背景色・雰囲気が変化 |
| グラフ | 5日分の気温推移を折れ線グラフで可視化（Chart.js） |
| ダークモード | 対応（Tailwind `darkMode: 'class'`、切替ボタン） |
| ローディング/エラー | スケルトンUI、都市が見つからない場合の丁寧なエラーメッセージ |
| レスポンシブ | スマホ幅を基準に作り込み |
| お気に入り都市 | Firestoreに保存。トップページで複数都市を横並びカードで比較表示 |
| 検索履歴 | 直近5件を自動記録（Firestore、NaviCastと同じ匿名ID方式） |
| PWA対応 | ホーム画面に追加可能、Next.js標準の `app/manifest.ts` + 最小構成 Service Worker |

### スコープ外（今回はやらない）
- ユーザー認証（匿名IDのみ。ログイン機能なし）
- One Call API 3.0が必要な機能（UV指数など。クレジットカード登録が必要なため回避）
- プッシュ通知

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS（`darkMode: 'class'`） |
| グラフ | Chart.js + react-chartjs-2 |
| 天気API | OpenWeatherMap（Geocoding API / Current Weather API / 5 Day-3 Hour Forecast API） |
| データベース | Firebase Firestore |
| ホスティング/デプロイ | Vercel |
| バージョン管理 | GitHub（リポジトリ名: `weather-app`、Public） |
| PWA | Next.js標準の `app/manifest.ts` + 最小構成の Service Worker（`public/sw.js`） |

### APIキーの扱い方針
- OpenWeatherMapのAPIキーは **サーバー側のみ**で使用（`OPENWEATHER_API_KEY`、`NEXT_PUBLIC_`なし）。クライアントからは直接叩かず、Next.jsのAPI Route（`app/api/weather/route.ts`）を経由してプロキシする。これにより本番ビルドにもキーが露出しない。
- Firebase Web Configはクライアントで必須のため `NEXT_PUBLIC_` を付けて公開する（Firebase Web Configは秘密情報ではなく、実際のアクセス制御はFirestoreセキュリティルールが担う）。

---

## データ取得フロー

1. クライアント（都市名 or 緯度経度）→ `GET /api/weather?city=...` または `?lat=..&lon=..`
2. API Route内で:
   - 都市名の場合: OpenWeatherMap Geocoding APIで緯度経度に変換
   - Current Weather API で現在の天気を取得
   - 5 Day/3 Hour Forecast API で予報を取得し、日別に集約（各日の代表値・最高/最低気温・降水確率の最大値などを算出）
3. まとめて1つのJSONレスポンスとしてクライアントに返す

---

## Firestore データモデル

匿名ID（`localStorage`に保存したUUID）をキーに、認証なしで保存する。

```
favorites/{favoriteId}
  - anonId: string        // ローカル生成UUID
  - cityName: string
  - lat: number
  - lon: number
  - createdAt: Timestamp

history/{historyId}
  - anonId: string
  - cityName: string
  - lat: number
  - lon: number
  - searchedAt: Timestamp
```

### セキュリティルール（Firestore console Rulesタブに貼り付け）

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /favorites/{docId} {
      allow read: if true;
      allow create: if request.resource.data.anonId is string;
      allow delete: if resource.data.anonId is string;
    }
    match /history/{docId} {
      allow read: if true;
      allow create: if request.resource.data.anonId is string;
      allow delete: if resource.data.anonId is string;
    }
  }
}
```

認証なし方式のため厳密な所有者検証はできない（NaviCastと同じ割り切り）。学習用アプリのため、個人情報を含まない都市名程度のデータに限定する。

**修正履歴（2026-07-12）**: 初版のルールは `allow read, create: if request.resource.data.anonId is string;` のように書いていたが、`read`（一覧取得）時は`request.resource`が存在せず常に拒否になるバグがあった。また`history`の古い履歴削除（5件超過分）に必要な`delete`権限が抜けていた。上記の内容に修正済み。

---

## プロジェクト構成（予定）

```
weather-app/
  app/
    layout.tsx
    page.tsx                  ("use client") — メイン画面
    manifest.ts                — PWA用Web App Manifest
    globals.css
    api/
      weather/
        route.ts               — OpenWeatherMapプロキシ（キーはサーバー側のみ）
  components/
    SearchBar.tsx               ("use client")
    LocationButton.tsx          ("use client")
    DateSelector.tsx            ("use client")
    WeatherDisplay.tsx          ("use client")
    TempChart.tsx               ("use client")
    FavoritesList.tsx           ("use client")
    HistoryList.tsx             ("use client")
    DarkModeToggle.tsx          ("use client")
    LoadingSkeleton.tsx
    ErrorMessage.tsx
    WeatherBackground.tsx       ("use client") — 天気に応じた背景演出
  lib/
    firebase.ts                 — initializeApp/getFirestore シングルトン
    firestore-favorites.ts       — お気に入り・履歴CRUD
    anon-id.ts                   — localStorage匿名ID発行
    weather-types.ts
    weather-icons.ts             — OpenWeatherMapアイコンコード→表示用マッピング
  public/
    icons/
    sw.js
  .env.local                    — gitignore対象
  .env.local.example
```

---

## 環境変数

```
OPENWEATHER_API_KEY               # サーバー側のみ。NEXT_PUBLIC_を付けない

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## 実行手順（サマリ）

1. `create-next-app` でscaffold（TypeScript + Tailwind + App Router）
2. `firebase`, `chart.js`, `react-chartjs-2` をインストール
3. **[手動]** OpenWeatherMapでアカウント作成・APIキー発行（無料プラン、クレジットカード不要のプランを選択）
4. **[手動]** Firebaseコンソールでプロジェクト作成・Firestore有効化・Webアプリ登録・config取得
5. API Route（天気プロキシ）を実装
6. コアUI実装（検索・現在地取得・日付切替・天気表示）
7. UX強化実装（ダークモード・ローディング/エラー・レスポンシブ・背景演出・グラフ）
8. Firestore連携実装（お気に入り・履歴）
9. **[手動]** Firestoreセキュリティルールを貼り付けてPublish
10. PWA対応
11. ローカル動作確認
12. `git init` → commit → `gh repo create weather-app --public --source=. --remote=origin --push`
13. Vercelデプロイ（env変数設定含む）
14. 本番URLで最終検証

---

## 検証観点

- 都市名検索・現在地取得の両方で正しい天気が表示されるか
- 日付ボタンで5日分の予報が正しく切り替わるか
- 都市が見つからない場合のエラー表示
- ダークモード切替
- お気に入り登録・削除、複数都市の比較表示
- 検索履歴が5件を超えたら古いものが消えるか
- リロード後もお気に入り・履歴がFirestoreから復元されるか
- PWAとしてホーム画面に追加できるか
- OpenWeatherMap APIキーが本番ビルドのクライアントJSに含まれていないこと（DevToolsで確認）
