# 📓 Jupyter Notebook Preview Web App

GitHubリポジトリからJupyter Notebookファイルを取得してプレビューできるWebアプリケーションです。GitHub CLI (`gh`)を使用してGitHub APIと連携します。

## 特徴

- ✨ GitHubリポジトリから直接Jupyter Notebookを取得
- 📁 ローカルファイルのアップロードにも対応
- 🎨 美しいUIでNotebookの内容を表示
- 🔍 コードセル、マークダウンセル、出力をすべてレンダリング
- 🖼️ 画像やグラフなどの出力も表示可能
- 💻 シンタックスハイライト対応

## 必要要件

- Python 3.7以上
- GitHub CLI (`gh`)
- GITHUB_TOKEN環境変数（プライベートリポジトリの場合）

## セットアップ

### 1. GitHub CLIのインストール

```bash
# macOS
brew install gh

# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# その他のプラットフォーム
# https://cli.github.com/ を参照
```

### 2. GitHub CLIの認証

```bash
gh auth login
```

または、環境変数を設定:

```bash
export GITHUB_TOKEN=your_github_token_here
```

### 3. Pythonパッケージのインストール

```bash
pip install -r requirements.txt
```

## 使い方

### サーバーの起動

```bash
python server.py
```

サーバーが起動したら、ブラウザで `http://localhost:5000` にアクセスします。

### GitHubからNotebookを取得

1. "GitHubから取得" タブを選択
2. リポジトリURLを入力（例: `https://github.com/user/repo` または `user/repo`）
3. Notebookファイルのパスを入力（例: `notebooks/example.ipynb`）
4. ブランチを指定（オプション、デフォルトはmainブランチ）
5. "取得" ボタンをクリック

### ローカルファイルのアップロード

1. "ファイルをアップロード" タブを選択
2. .ipynbファイルを選択
3. "読み込み" ボタンをクリック

## API エンドポイント

### Health Check

```bash
GET /api/health
```

レスポンス例:
```json
{
  "status": "ok",
  "gh_cli_available": true,
  "github_token_set": true
}
```

### Notebookを取得

```bash
POST /api/fetch-notebook
Content-Type: application/json

{
  "repo_url": "user/repo",
  "file_path": "notebooks/example.ipynb",
  "branch": "main"
}
```

### Notebookファイルをリスト

```bash
POST /api/list-notebooks
Content-Type: application/json

{
  "repo_url": "user/repo",
  "branch": "main"
}
```

## プロジェクト構造

```
jupyter-preview-app/
├── index.html          # メインHTMLファイル
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── app.js          # メインアプリケーションロジック
│   └── github-api.js   # GitHub API連携モジュール
├── server.py           # Flaskバックエンドサーバー
├── requirements.txt    # Python依存関係
└── README.md          # このファイル
```

## 技術スタック

### フロントエンド
- HTML5/CSS3
- Vanilla JavaScript
- [marked.js](https://marked.js.org/) - マークダウンのレンダリング
- [highlight.js](https://highlightjs.org/) - シンタックスハイライト

### バックエンド
- Python 3
- Flask - Webフレームワーク
- flask-cors - CORS対応
- GitHub CLI (`gh`) - GitHub API連携

## トラブルシューティング

### GitHub CLIが見つからない

```
ERROR: GitHub CLI (gh) is not available
```

GitHub CLIをインストールしてください: https://cli.github.com/

### GITHUB_TOKENが設定されていない

プライベートリポジトリにアクセスする場合は、GITHUB_TOKENを設定してください:

```bash
export GITHUB_TOKEN=your_token_here
python server.py
```

### APIレート制限

GitHub APIには認証なしの場合、1時間あたり60リクエストの制限があります。GITHUB_TOKENを設定することで、5000リクエストまで増やせます。

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！

## 関連リンク

- [GitHub CLI](https://cli.github.com/)
- [GitHub API](https://docs.github.com/en/rest)
- [Jupyter Notebook Format](https://nbformat.readthedocs.io/)
