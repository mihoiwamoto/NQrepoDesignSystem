# NQrepo Design System

NQrepo のデザインシステム / デザインガイドライン(静的HTML)。

## ページ構成

- `nqrepo-design-guide.html` — デザインガイド本体(ブランド〜スタイル〜コンポーネントを 1 ページに収録)。`/` にリライトされて公開
- `nqrepo-design-brand.html` — ブランド(デザインの前提・役割・スコープ)
- `nqrepo-design-principles.html` — デザイン原則
- `nqrepo-design-styles.html` — スタイル(カラー・タイポグラフィ・アイコン・エレベーション・ボタンと、UI 部品ごとの詳細タブ)
- `nqrepo-design-components.html` — コンポーネントライブラリ(スコープ別の一覧。各カードはスタイルページの該当タブへリンク)

## 共通アセット

- `assets/nqrepo-guide.css` — トップ・ブランド・スタイル・コンポーネントの 4 ページが共有するスタイル
- `assets/nqrepo-doc.css` — 分割ページ（ブランド / スタイル / コンポーネント）のドキュメントレイアウトと目次
- `assets/nqrepo-brand.css` — ブランドページ固有のパーツ（ロゴ・ブランドカラー・禁止パターンなど）。トップページの 01 セクションでも使用
- `assets/nqrepo-components.css` — コンポーネント一覧のカード表示・ミニプレビュー・絞り込みバー。トップページの 03 セクションでも使用
- `assets/nqrepo-components.js` — コンポーネント一覧の検索 / スコープ絞り込み
- `assets/nqrepo-icons.js` — アイコンギャラリーのデータ(`NQ_ICONS`)。スタイルページのみ読み込む
- `assets/nqrepo-guide.js` — アイコンギャラリー / モーダル / コンポーネント一覧タブの動作。スタイルページのみ読み込む
- `assets/nqrepo-live.css` / `assets/nqrepo-live.js` — スタイルページの App + Admin 共通 / App のみ / Admin のみ の各部品（入力欄・セレクト・日付・チェック・ラジオ・タブ・アコーディオン・ページネーション・ダイアログ・トーストなど）を実際に操作できるようにする実装。静的モックに `<input>` / `<textarea>` を差し込み、`data-nqf-act` で振る舞いを付与する。スタイルページのみ読み込む
- `assets/nqrepo-play.css` / `assets/nqrepo-play.js` — 1つのプレビューで部品とバリアントを切り替えるプレイグラウンドと、それを収めるカード（`.nqcard`）の体裁。カードは **プレビュー → 部品名 → 操作（チップ）→ アクション（コードを見る／プロンプトをコピー）** の順。`[data-nqf-play]` 内の `.nqf-play-chip`（部品）・`.nqf-play-toggle` / `.nqf-play-seg`（バリアント）で `.nqf-play-item` の表示を切り替える。スタイルページのみ読み込む
- `assets/nqrepo-fold.js` — セクション（App / Admin ブロック）内に並んでいた部品ごとのプレビュー（`.btn-set`）を読み取り、上記プレイグラウンドの形に組み替えて1つのプレビューにまとめる。部品チップ＝`.btn-set`、バリアントチップ＝各 `.btn-sample` のキャプション（全バリアントで共通のプロパティはチップから省く）。HTML は書き換えないので、ページの記述を直せばそのまま反映される。併せてカード（`.nqcard`）の並べ替えとアクション欄（`.nqf-play-actions`）の設置も行い、Figma のスクリーンショットだけのブロックも同じカードの体裁にそろえる。`nqrepo-play.js` / `nqrepo-code.js` / `nqrepo-prompt.js` より前に読み込むこと
- `assets/nqrepo-code.css` / `assets/nqrepo-code.js` — カードの「コードを見る」。表示中のプレビューそのものから HTML を書き出し、そこで使われているクラスに当たる CSS 規則をページのスタイルシートから拾ってダイアログに出す（HTML / CSS のタブ切り替えとコピー）。出力はページの実装を写したものなので、ページを直せばコードも追従する。スタイルページのみ読み込む
- `assets/nqrepo-prompt.css` / `assets/nqrepo-prompt.js` — カード下部のアクション欄（`.nqf-play-actions`）に「プロンプトをコピー」ボタンを置き、入力スペースなど部品ひとつ分の AI 向け実装プロンプト（仕様・バリアント表の該当行・サイズ・キャプション）を生成してクリップボードへコピーする。ボタンはカードに1つ置き、選択中の部品を対象にする。部品に分かれていない（スクリーンショットのみの）ブロックはブロック単位のプロンプトになる。スタイルページのみ読み込む

デザイン原則ページ(`nqrepo-design-principles.html`)は従来どおり自前の `<style>` を持つ独立ページです。

## その他

- `images/` — ロゴ・アイコン素材
- `*.dc.html`, `canvas.json` — Claude Design キャンバス用ソース
- `*-cute.html` — 別トーンの試作(公開ナビからはリンクしていない)

Vercel で静的サイトとしてホスティングしています。ビルド工程はありません。
