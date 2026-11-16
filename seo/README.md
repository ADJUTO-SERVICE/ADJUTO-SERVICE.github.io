# ADJUTO SEO SYSTEM Phase 2

公式サイトの記事生成・審査の試作です。Node.js 22以上を使用します。プレビューはGit管理外のローカルフォルダに出力します。公開ワークフローはPhase 3の対象です。

## 模擬応答で検証

```sh
node seo/prototype.test.mjs
```

## Gemini APIで検証

課金を設定していないプロジェクトで利用可能な安定版モデルを選択し、環境変数 `GEMINI_MODEL` にモデルID、`GEMINI_API_KEY` にAPIキーを設定します。値を入力JSONやGitに保存しないでください。

```sh
node seo/prototype.mjs ../seo-input.json ../seo-preview.html
```

入力は次の構造です。根拠と既存ページのサンプル値は実データで置き換えます。顧客情報や問い合わせ原文は入力しません。

```json
{
  "topic": {
    "slug": "remote-estate-guide",
    "question": "遠方から遺品整理を依頼するときに何を準備するか",
    "service": "遺品整理・生前整理"
  },
  "sources": [
    {
      "id": "company-procedure-1",
      "kind": "company",
      "public": false,
      "original": true,
      "service": "遺品整理・生前整理",
      "fact": "社内で確認し、掲載が承認された具体的な手順などを記入",
      "url": "https://adjuto-service.github.io/",
      "checkedOn": "2026-11-17"
    }
  ],
  "existing": [
    {
      "path": "/",
      "title": "実際のページのタイトル",
      "body": "実際のページの主な本文"
    }
  ]
}
```

- `topic.region` は任意で、東京・神奈川・千葉・埼玉・茨城の正式都県名を指定できます。地域指定の企画には同じ地域に紐づく会社独自の根拠が必要です。
- `sources` の `kind` は会社承認済み情報の `company` または公的資料の `official`。公開利用できると確認した項目だけを `public: true` とし、独自性の根拠として使える会社情報に `original: true` を付けます。有効期限のある情報には `expiresOn` を指定します。
- `existing` には既存の公開ページと記事を入れます。試作では入力カタログを使います。後続段階で公開サイトの取得とカタログ同期をつなぎます。
- 合格時にだけ新規HTMLを作成します。既存ファイルは上書きしません。プレビューに `noindex,nofollow` を付けます。
- CLIは判定・審査理由を標準出力に返します。APIエラーの場合は異常終了します。公開は行いません。

## 公開頻度

本番運用開始時に決める日本時間の起点日から2日ごとに、最大1本。候補が合格しなければ0本です。月をまたいでも連続した日数で判定する `isPublicationDay` を用意しています。定期実行と実行日あたり1本の制御は公開処理の実装時につなぎます。

## Phase 3のテスト

```sh
node seo/staging.test.mjs
node seo/staging.mjs ../seo-input.json YYYY-MM-DD
```

第2引数は隔日の起点日です。後者は日本時間の対象日にだけ実行し、有効な根拠がある場合にGemini APIを呼びます。合格時は一時フォルダに既存サイトと記事1本を含むプレビューを出力し、そのコピーのサイトマップへ記事URLを追記します。元のサイトマップは保存されます。Geminiを呼ぶ場合は上記の環境変数を使用します。テスト用ワークフローは専用ブランチへのpushで模擬データのテストだけを実行します。

プレビューのHTMLはnoindex付きです。アクセスを制限した環境から確認してください。記事のテスト出力と一時フォルダの削除は実行者が管理します。既存の記事がある場合の上書き・履歴の管理、公開デプロイ、定期実行、公開後の復旧は本番ワークフローに接続する際に実装・検証します。
