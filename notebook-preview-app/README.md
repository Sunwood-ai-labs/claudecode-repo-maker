# 📓 Jupyter Notebook プレビューアプリ

Jupyter Notebook (.ipynb) ファイルをブラウザで美しくプレビューするWebアプリケーションです。

## 特徴

- 🚀 **完全にクライアントサイドで動作** - サーバー不要、ブラウザだけで動作
- 📁 **ドラッグ&ドロップ対応** - 簡単にファイルをアップロード
- 🎨 **シンタックスハイライト** - コードを見やすく表示
- 📊 **出力の完全サポート** - テキスト、画像、HTML、エラーなど
- 📱 **レスポンシブデザイン** - モバイルでも快適に閲覧

## 使い方

### 1. アプリを起動

ローカルでHTTPサーバーを起動します：

```bash
# Python3を使用する場合
cd notebook-preview-app
python3 -m http.server 8000

# Node.jsのhttp-serverを使用する場合
npx http-server -p 8000
```

ブラウザで `http://localhost:8000` を開きます。

### 2. Notebookファイルを読み込む

以下の2つの方法でNotebookを読み込めます：

- **ファイルアップロード**: アップロードエリアをクリックまたはファイルをドラッグ&ドロップ
- **サンプルNotebook**: 「サンプルNotebookを読み込む」ボタンをクリック

### 3. Notebookを閲覧

アップロードしたNotebookが美しく整形されて表示されます。

## ディレクトリ構造

```
notebook-preview-app/
├── index.html          # メインHTMLファイル
├── css/
│   └── style.css      # スタイルシート
├── js/
│   └── app.js         # アプリケーションロジック
├── samples/
│   └── sample.ipynb   # サンプルNotebook
└── README.md          # このファイル
```

## 技術スタック

- **HTML5** - マークアップ
- **CSS3** - スタイリング（カスタム変数、グリッドレイアウト）
- **Vanilla JavaScript** - アプリケーションロジック
- **Highlight.js** - コードのシンタックスハイライト
- **Marked.js** - マークダウンのレンダリング

## 対応している機能

### セルタイプ
- ✅ コードセル
- ✅ マークダウンセル

### 出力タイプ
- ✅ `stream` (print文など)
- ✅ `execute_result` (戻り値)
- ✅ `display_data` (表示データ)
- ✅ `error` (エラートレースバック)

### データ形式
- ✅ `text/plain`
- ✅ `text/html`
- ✅ `image/png` (Base64エンコード)

## カスタマイズ

### 配色の変更

`css/style.css` の `:root` セクションでCSS変数を変更できます：

```css
:root {
    --primary-color: #f37726;    /* Jupiterオレンジ */
    --secondary-color: #4a90e2;  /* ブルー */
    --success-color: #27ae60;    /* グリーン */
    --error-color: #e74c3c;      /* レッド */
    /* ... */
}
```

### サポートする言語の追加

Highlight.jsの設定で追加の言語をサポートできます。

## ブラウザサポート

- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)

## ライセンス

MIT License

## 今後の実装予定

詳細な実装計画は `reports/work-report-jupyter-notebook-preview-app.md` を参照してください。

主な追加機能：
- セルの展開/折りたたみ機能
- ダークモード対応
- エクスポート機能（HTML、PDF）
- より多くの出力形式のサポート（SVG、LaTeX等）
- セル番号での検索機能
- 複数ファイルの比較表示

## 貢献

バグ報告や機能リクエストは Issue を作成してください。プルリクエストも歓迎します！
