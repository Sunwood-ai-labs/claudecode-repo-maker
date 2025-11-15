// GitHub API連携モジュール
class GitHubAPI {
    constructor(token = null) {
        this.token = token || this.getTokenFromEnv();
        this.baseURL = 'https://api.github.com';
    }

    // 環境変数からトークンを取得（実際のブラウザでは使用不可）
    getTokenFromEnv() {
        // Note: ブラウザでは環境変数にアクセスできないため、
        // トークンはローカルストレージまたは入力フィールドから取得する必要があります
        return localStorage.getItem('github_token') || null;
    }

    // トークンを設定
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('github_token', token);
        }
    }

    // リポジトリURLからオーナーとリポジトリ名を抽出
    parseRepoURL(url) {
        const patterns = [
            /github\.com\/([^\/]+)\/([^\/]+)/,
            /^([^\/]+)\/([^\/]+)$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2].replace(/\.git$/, '')
                };
            }
        }
        return null;
    }

    // ファイルコンテンツを取得
    async getFileContent(owner, repo, path, branch = 'main') {
        const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('ファイルが見つかりません');
                } else if (response.status === 403) {
                    throw new Error('APIレート制限に達しました。GitHubトークンを設定してください');
                }
                throw new Error(`GitHub API エラー: ${response.status}`);
            }

            const data = await response.json();

            // Base64デコード
            const content = atob(data.content);
            return {
                content: content,
                sha: data.sha,
                size: data.size,
                url: data.html_url
            };
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
        }
    }

    // リポジトリ情報を取得
    async getRepoInfo(owner, repo) {
        const url = `${this.baseURL}/repos/${owner}/${repo}`;

        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`リポジトリ情報の取得に失敗: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Repository Info Error:', error);
            throw error;
        }
    }

    // デフォルトブランチを取得
    async getDefaultBranch(owner, repo) {
        try {
            const repoInfo = await this.getRepoInfo(owner, repo);
            return repoInfo.default_branch || 'main';
        } catch (error) {
            return 'main';
        }
    }

    // ディレクトリ内のファイル一覧を取得
    async listFiles(owner, repo, path = '', branch = 'main') {
        const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`ファイル一覧の取得に失敗: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('List Files Error:', error);
            throw error;
        }
    }

    // .ipynbファイルを検索
    async findNotebooks(owner, repo, branch = 'main') {
        try {
            const files = await this.listFiles(owner, repo, '', branch);
            const notebooks = [];

            for (const file of files) {
                if (file.type === 'file' && file.name.endsWith('.ipynb')) {
                    notebooks.push({
                        name: file.name,
                        path: file.path,
                        url: file.html_url
                    });
                } else if (file.type === 'dir') {
                    // 再帰的にサブディレクトリを探索（簡略版）
                    try {
                        const subFiles = await this.listFiles(owner, repo, file.path, branch);
                        for (const subFile of subFiles) {
                            if (subFile.type === 'file' && subFile.name.endsWith('.ipynb')) {
                                notebooks.push({
                                    name: subFile.name,
                                    path: subFile.path,
                                    url: subFile.html_url
                                });
                            }
                        }
                    } catch (e) {
                        console.warn(`サブディレクトリの探索に失敗: ${file.path}`);
                    }
                }
            }

            return notebooks;
        } catch (error) {
            console.error('Find Notebooks Error:', error);
            throw error;
        }
    }
}

// グローバルインスタンスを作成
window.githubAPI = new GitHubAPI();
