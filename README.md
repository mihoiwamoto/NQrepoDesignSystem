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

デザイン原則ページ(`nqrepo-design-principles.html`)は従来どおり自前の `<style>` を持つ独立ページです。

## その他

- `images/` — ロゴ・アイコン素材
- `*.dc.html`, `canvas.json` — Claude Design キャンバス用ソース
- `*-cute.html` — 別トーンの試作(公開ナビからはリンクしていない)

Vercel で静的サイトとしてホスティングしています。ビルド工程はありません。
