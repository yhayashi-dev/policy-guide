# 法案・政策論点のやさしい解説

日本の法案・制度改正を、一次情報に基づいて平易に説明する静的Webサイトです。30テーマを掲載。情報確認日は2026年9月10日です。

## この成果物

- トップ：キーワード検索、分野・状況の複合絞り込み、更新順の記事一覧
- 記事：要約、変更点、現在地、日付、対象者、論点、両側の説明、誤解、今後、出典、確認日の13項目
- 編集方針、404ページ、レスポンシブ表示、キーボード操作、印刷用スタイル
- 静的HTML、記事別メタデータ、canonical、sitemap.xml、robots.txt、GitHub Pagesの手動公開ワークフロー
- バックエンド・ログイン・データベース・解析サービスなし。記事と出典はJSONで管理

既存のpaycheck-insightとは別フォルダ・別Git管理です。

## 構成

```text
app/                    ページ・共通レイアウト・スタイル
components/catalog.tsx  検索と一覧（ブラウザで動く部分）
components/ui/          Sites雛形に含まれる部品（入力欄だけ使用）
content/articles.json   記事本文・状態・日付・参照ID
content/sources.json    一次情報のURL・発行元・確認日
lib/                    共通処理と検索条件
scripts/                内容検証・静的出力整形・リンク検証・更新期限一覧
tests/                  検索・情報整合性のテスト
docs/                   企画・編集運用・情報確認・検証記録
.github/workflows/      手動実行のGitHub Pages公開
 dist/client/           ビルド後の配信ファイル（Git対象外）
```

## ローカルで使う

Node.js 24、pnpm 11.19.0を使用します。配信先にはNode.jsは不要です。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

静的ファイルの生成・確認：

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm check:links
pnpm preview
```

プレビューは http://127.0.0.1:4173/ です。HTMLを直接ダブルクリックするのではなくHTTPで配信してください。検索の動作にJavaScriptを使いますが、記事の本文はHTMLに含まれます。

`pnpm lint`は当プロジェクトの実装と使用する入力部品を対象にします。雛形に付属する未使用の部品は変更せず、検査の対象外にしています。依存パッケージのインストールスクリプトは実行しない設定です。固定ロックファイルを含みます。

## GitHub Pagesで公開する

1. このフォルダを**新しい専用リポジトリ**に登録します。既存の給与計算プロジェクトには追加しません。
2. リポジトリのSettings → Pages → SourceでGitHub Actionsを選びます。
3. 運営者名・訂正連絡先を編集方針に追加し、記事の一次情報を再確認します。
4. Actions → Publish static site to GitHub Pages → Run workflowを実行します。

ワークフローは公開先のURLとパスを取得し、テスト・ビルド・内部リンク確認後に静的ファイルを公開します。自動のpushトリガーは設定していません。無料利用を優先する場合は、GitHub Pagesを無料利用できる公開リポジトリで運用してください。

独自ドメイン等で手動生成するとき：

```sh
SITE_URL=https://your-site.example BASE_PATH='' pnpm build
```

プロジェクト配下で公開するとき（値は実際のURLへ置き換える）：

```sh
SITE_URL=https://your-account.github.io/policy-guide BASE_PATH=/policy-guide pnpm build
BASE_PATH=/policy-guide pnpm check:links
```

`SITE_URL`未設定では、公開先を推測しないため検索エンジンの登録を抑制し、サイトマップは空になります。URLを設定した公開ビルドでは32ページの正規URLを生成します。`dist/client`だけを配信します。`.nojekyll`も同梱されます。

Sitesの静的配信にも対応する設定を残していますが、今回は公開準備までのため、Sites登録・アップロード・一般公開は行っていません。

## 記事を更新する

[更新手順](docs/EDITORIAL.md)、[一次情報確認記録](docs/SOURCES.md)をご覧ください。

```sh
node scripts/review-due.mjs
node scripts/check-links.mjs --external
```

更新期限を過ぎても、記事の状態や確認日を自動変更しません。リンクが200を返しても内容が正しい保証にはならないため、人が根拠を照合してください。

## 公開・運営

公開先：https://yhayashi-dev.github.io/policy-guide/
リポジトリ：yhayashi-dev/policy-guide。mainへのpushでGitHub Actionsが検証・静的ビルド・Pages配信を行います。公開成否はActionsと実URLで確認してください。
30テーマを監査済み。About、Privacy、問い合わせ・訂正窓口を整備しています。個別手続きの判断は最新の公式窓口で確認してください。
正式開発はこのローカルチェックアウトで行い、旧一時領域の保全コピーを更新しません。本文・出典変更後はテスト、型、lint、build、内部リンクを再検証してください。
公開設定：SITE_URL=https://yhayashi-dev.github.io/policy-guide BASE_PATH=/policy-guide。SITE_URLを指定しないローカル確認用buildはnoindexです。
