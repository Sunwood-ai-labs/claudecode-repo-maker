// メインアプリケーションロジック
class NotebookViewer {
    constructor() {
        this.currentNotebook = null;
        this.initializeEventListeners();
        this.initializeMarked();
    }

    initializeMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (e) {
                            console.error('Highlight error:', e);
                        }
                    }
                    return hljs.highlightAuto(code).value;
                },
                breaks: true,
                gfm: true
            });
        }
    }

    initializeEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // GitHub取得ボタン
        document.getElementById('fetch-button').addEventListener('click', () => {
            this.fetchFromGitHub();
        });

        // アップロードボタン
        document.getElementById('upload-button').addEventListener('click', () => {
            this.uploadFile();
        });

        // ファイル選択時の自動読み込み
        document.getElementById('file-upload').addEventListener('change', () => {
            this.uploadFile();
        });

        // Enterキーでの取得
        ['repo-url', 'file-path', 'branch'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.fetchFromGitHub();
                }
            });
        });
    }

    switchTab(tabName) {
        // タブボタンの切り替え
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // タブコンテンツの切り替え
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', !content.id.startsWith(tabName));
        });
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.classList.remove('hidden');

        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
    }

    hideStatus() {
        document.getElementById('status').classList.add('hidden');
    }

    async fetchFromGitHub() {
        const repoUrl = document.getElementById('repo-url').value.trim();
        const filePath = document.getElementById('file-path').value.trim();
        let branch = document.getElementById('branch').value.trim();

        if (!repoUrl || !filePath) {
            this.showStatus('リポジトリURLとファイルパスを入力してください', 'error');
            return;
        }

        const button = document.getElementById('fetch-button');
        button.disabled = true;
        button.textContent = '取得中...';

        try {
            this.showStatus('GitHubからファイルを取得しています...', 'info');

            // リポジトリ情報を解析
            const repoInfo = window.githubAPI.parseRepoURL(repoUrl);
            if (!repoInfo) {
                throw new Error('無効なリポジトリURLです');
            }

            // ブランチが指定されていない場合はデフォルトブランチを取得
            if (!branch) {
                branch = await window.githubAPI.getDefaultBranch(repoInfo.owner, repoInfo.repo);
            }

            // ファイルを取得
            const fileData = await window.githubAPI.getFileContent(
                repoInfo.owner,
                repoInfo.repo,
                filePath,
                branch
            );

            // JSONとしてパース
            const notebook = JSON.parse(fileData.content);

            // ノートブック情報を表示
            this.displayNotebookInfo({
                repository: `${repoInfo.owner}/${repoInfo.repo}`,
                branch: branch,
                path: filePath,
                size: fileData.size,
                url: fileData.url
            });

            // ノートブックを表示
            this.renderNotebook(notebook);

            this.showStatus('ノートブックの読み込みに成功しました！', 'success');
        } catch (error) {
            console.error('Fetch error:', error);
            this.showStatus(`エラー: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.textContent = '取得';
        }
    }

    async uploadFile() {
        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];

        if (!file) {
            this.showStatus('ファイルを選択してください', 'error');
            return;
        }

        if (!file.name.endsWith('.ipynb')) {
            this.showStatus('.ipynb ファイルを選択してください', 'error');
            return;
        }

        const button = document.getElementById('upload-button');
        button.disabled = true;
        button.textContent = '読み込み中...';

        try {
            this.showStatus('ファイルを読み込んでいます...', 'info');

            const content = await file.text();
            const notebook = JSON.parse(content);

            // ノートブック情報を表示
            this.displayNotebookInfo({
                filename: file.name,
                size: file.size,
                lastModified: new Date(file.lastModified).toLocaleString('ja-JP')
            });

            // ノートブックを表示
            this.renderNotebook(notebook);

            this.showStatus('ノートブックの読み込みに成功しました！', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus(`エラー: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.textContent = '読み込み';
        }
    }

    displayNotebookInfo(info) {
        const infoDiv = document.getElementById('notebook-info');
        const contentDiv = document.getElementById('info-content');

        let html = '';
        if (info.repository) {
            html += `<p><strong>リポジトリ:</strong> ${info.repository}</p>`;
            html += `<p><strong>ブランチ:</strong> ${info.branch}</p>`;
            html += `<p><strong>パス:</strong> ${info.path}</p>`;
            if (info.url) {
                html += `<p><strong>GitHub:</strong> <a href="${info.url}" target="_blank">ファイルを開く</a></p>`;
            }
        } else if (info.filename) {
            html += `<p><strong>ファイル名:</strong> ${info.filename}</p>`;
            html += `<p><strong>最終更新:</strong> ${info.lastModified}</p>`;
        }
        html += `<p><strong>サイズ:</strong> ${this.formatBytes(info.size)}</p>`;

        contentDiv.innerHTML = html;
        infoDiv.classList.remove('hidden');
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    renderNotebook(notebook) {
        this.currentNotebook = notebook;
        const container = document.getElementById('notebook-container');
        container.innerHTML = '';

        if (!notebook.cells || notebook.cells.length === 0) {
            container.innerHTML = '<p>このノートブックには表示可能なセルがありません。</p>';
            return;
        }

        notebook.cells.forEach((cell, index) => {
            const cellElement = this.createCellElement(cell, index);
            container.appendChild(cellElement);
        });
    }

    createCellElement(cell, index) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.dataset.index = index;

        // セルヘッダー
        const headerDiv = document.createElement('div');
        headerDiv.className = `cell-header ${cell.cell_type}`;
        headerDiv.textContent = cell.cell_type === 'code' ? 'Code' : 'Markdown';
        cellDiv.appendChild(headerDiv);

        // セルコンテンツ
        const contentDiv = document.createElement('div');
        contentDiv.className = 'cell-content';

        if (cell.cell_type === 'code') {
            // コードセル
            const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.className = 'language-python';
            code.textContent = source;

            // シンタックスハイライト
            if (typeof hljs !== 'undefined') {
                hljs.highlightElement(code);
            }

            pre.appendChild(code);
            contentDiv.appendChild(pre);

            // 出力
            if (cell.outputs && cell.outputs.length > 0) {
                const outputDiv = this.createOutputElement(cell.outputs);
                cellDiv.appendChild(outputDiv);
            }
        } else if (cell.cell_type === 'markdown') {
            // マークダウンセル
            const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
            const markdownDiv = document.createElement('div');
            markdownDiv.className = 'markdown-content';

            if (typeof marked !== 'undefined') {
                markdownDiv.innerHTML = marked.parse(source);
            } else {
                markdownDiv.textContent = source;
            }

            contentDiv.appendChild(markdownDiv);
        }

        cellDiv.appendChild(contentDiv);
        return cellDiv;
    }

    createOutputElement(outputs) {
        const outputDiv = document.createElement('div');
        outputDiv.className = 'cell-output';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'cell-output-header';
        headerDiv.textContent = 'Output';
        outputDiv.appendChild(headerDiv);

        outputs.forEach(output => {
            const outputContentDiv = document.createElement('div');

            if (output.output_type === 'stream') {
                // ストリーム出力（print文など）
                const text = Array.isArray(output.text) ? output.text.join('') : output.text;
                const pre = document.createElement('pre');
                pre.textContent = text;
                outputContentDiv.appendChild(pre);
            } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
                // 実行結果またはディスプレイデータ
                if (output.data) {
                    if (output.data['image/png']) {
                        // PNG画像
                        const img = document.createElement('img');
                        img.src = 'data:image/png;base64,' + output.data['image/png'];
                        outputContentDiv.appendChild(img);
                    } else if (output.data['image/jpeg']) {
                        // JPEG画像
                        const img = document.createElement('img');
                        img.src = 'data:image/jpeg;base64,' + output.data['image/jpeg'];
                        outputContentDiv.appendChild(img);
                    } else if (output.data['text/html']) {
                        // HTML
                        const html = Array.isArray(output.data['text/html'])
                            ? output.data['text/html'].join('')
                            : output.data['text/html'];
                        const div = document.createElement('div');
                        div.innerHTML = html;
                        outputContentDiv.appendChild(div);
                    } else if (output.data['text/plain']) {
                        // プレーンテキスト
                        const text = Array.isArray(output.data['text/plain'])
                            ? output.data['text/plain'].join('')
                            : output.data['text/plain'];
                        const pre = document.createElement('pre');
                        pre.textContent = text;
                        outputContentDiv.appendChild(pre);
                    }
                }
            } else if (output.output_type === 'error') {
                // エラー出力
                const errorDiv = document.createElement('div');
                errorDiv.style.color = '#d32f2f';
                const traceback = output.traceback ? output.traceback.join('\n') : output.evalue;
                const pre = document.createElement('pre');
                pre.textContent = traceback;
                errorDiv.appendChild(pre);
                outputContentDiv.appendChild(errorDiv);
            }

            outputDiv.appendChild(outputContentDiv);
        });

        return outputDiv;
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.notebookViewer = new NotebookViewer();
    console.log('Jupyter Notebook Viewer initialized');
});
