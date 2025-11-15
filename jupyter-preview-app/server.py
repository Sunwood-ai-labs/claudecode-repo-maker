#!/usr/bin/env python3
"""
Jupyter Notebook Preview Web App - Backend Server
GitHub CLIを使用してnotebookを取得するシンプルなAPIサーバー
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import json
import os
import base64
import re

app = Flask(__name__, static_folder='.')
CORS(app)

# GitHub CLIの利用可能性を確認
def check_gh_cli():
    try:
        result = subprocess.run(['gh', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

# GitHub CLIを使用してファイルを取得
def fetch_file_with_gh(owner, repo, path, branch='main'):
    try:
        # gh api を使用してファイルコンテンツを取得
        api_path = f'/repos/{owner}/{repo}/contents/{path}'
        if branch:
            api_path += f'?ref={branch}'

        result = subprocess.run(
            ['gh', 'api', api_path],
            capture_output=True,
            text=True,
            env=dict(os.environ, GITHUB_TOKEN=os.getenv('GITHUB_TOKEN', ''))
        )

        if result.returncode != 0:
            return None, f"GitHub CLI error: {result.stderr}"

        data = json.loads(result.stdout)

        # Base64デコード
        content = base64.b64decode(data['content']).decode('utf-8')

        return {
            'content': content,
            'sha': data['sha'],
            'size': data['size'],
            'url': data.get('html_url', '')
        }, None

    except Exception as e:
        return None, str(e)

# リポジトリのデフォルトブランチを取得
def get_default_branch(owner, repo):
    try:
        result = subprocess.run(
            ['gh', 'api', f'/repos/{owner}/{repo}'],
            capture_output=True,
            text=True,
            env=dict(os.environ, GITHUB_TOKEN=os.getenv('GITHUB_TOKEN', ''))
        )

        if result.returncode == 0:
            data = json.loads(result.stdout)
            return data.get('default_branch', 'main')
        return 'main'

    except Exception:
        return 'main'

# URLからowner/repoを抽出
def parse_repo_url(url):
    patterns = [
        r'github\.com/([^/]+)/([^/]+)',
        r'^([^/]+)/([^/]+)$'
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            repo = match.group(2).replace('.git', '')
            return match.group(1), repo

    return None, None

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/health', methods=['GET'])
def health_check():
    gh_available = check_gh_cli()
    token_set = bool(os.getenv('GITHUB_TOKEN'))

    return jsonify({
        'status': 'ok',
        'gh_cli_available': gh_available,
        'github_token_set': token_set
    })

@app.route('/api/fetch-notebook', methods=['POST'])
def fetch_notebook():
    data = request.json
    repo_url = data.get('repo_url', '')
    file_path = data.get('file_path', '')
    branch = data.get('branch', '')

    if not repo_url or not file_path:
        return jsonify({'error': 'repo_url and file_path are required'}), 400

    # GitHub CLIの確認
    if not check_gh_cli():
        return jsonify({'error': 'GitHub CLI (gh) is not available'}), 500

    # リポジトリ情報を解析
    owner, repo = parse_repo_url(repo_url)
    if not owner or not repo:
        return jsonify({'error': 'Invalid repository URL'}), 400

    # ブランチが指定されていない場合はデフォルトブランチを取得
    if not branch:
        branch = get_default_branch(owner, repo)

    # ファイルを取得
    file_data, error = fetch_file_with_gh(owner, repo, file_path, branch)

    if error:
        return jsonify({'error': error}), 500

    try:
        # Notebookをパース
        notebook = json.loads(file_data['content'])

        return jsonify({
            'notebook': notebook,
            'info': {
                'repository': f'{owner}/{repo}',
                'branch': branch,
                'path': file_path,
                'size': file_data['size'],
                'url': file_data['url']
            }
        })
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid notebook format'}), 400

@app.route('/api/list-notebooks', methods=['POST'])
def list_notebooks():
    data = request.json
    repo_url = data.get('repo_url', '')
    branch = data.get('branch', '')

    if not repo_url:
        return jsonify({'error': 'repo_url is required'}), 400

    # GitHub CLIの確認
    if not check_gh_cli():
        return jsonify({'error': 'GitHub CLI (gh) is not available'}), 500

    # リポジトリ情報を解析
    owner, repo = parse_repo_url(repo_url)
    if not owner or not repo:
        return jsonify({'error': 'Invalid repository URL'}), 400

    # ブランチが指定されていない場合はデフォルトブランチを取得
    if not branch:
        branch = get_default_branch(owner, repo)

    # リポジトリのコンテンツを取得
    try:
        result = subprocess.run(
            ['gh', 'api', f'/repos/{owner}/{repo}/git/trees/{branch}?recursive=1'],
            capture_output=True,
            text=True,
            env=dict(os.environ, GITHUB_TOKEN=os.getenv('GITHUB_TOKEN', ''))
        )

        if result.returncode != 0:
            return jsonify({'error': f'Failed to list files: {result.stderr}'}), 500

        data = json.loads(result.stdout)
        tree = data.get('tree', [])

        # .ipynbファイルのみを抽出
        notebooks = []
        for item in tree:
            if item['type'] == 'blob' and item['path'].endswith('.ipynb'):
                notebooks.append({
                    'path': item['path'],
                    'name': os.path.basename(item['path'])
                })

        return jsonify({
            'notebooks': notebooks,
            'count': len(notebooks)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Jupyter Notebook Preview Server")
    print("=" * 60)

    # 環境確認
    gh_available = check_gh_cli()
    token_set = bool(os.getenv('GITHUB_TOKEN'))

    print(f"GitHub CLI available: {gh_available}")
    print(f"GITHUB_TOKEN set: {token_set}")

    if not gh_available:
        print("\n⚠️  WARNING: GitHub CLI (gh) is not available!")
        print("   Please install it: https://cli.github.com/")

    if not token_set:
        print("\n⚠️  WARNING: GITHUB_TOKEN is not set!")
        print("   Set it with: export GITHUB_TOKEN=your_token")

    print("\n🚀 Starting server on http://localhost:5000")
    print("=" * 60)

    app.run(debug=True, host='0.0.0.0', port=5000)
