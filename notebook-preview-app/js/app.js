// グローバル変数
let currentNotebook = null;

// DOM要素
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const notebookContent = document.getElementById('notebookContent');
const notebookInfo = document.getElementById('notebookInfo');
const infoContent = document.getElementById('infoContent');

// イベントリスナーの設定
uploadBox.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
loadSampleBtn.addEventListener('click', loadSampleNotebook);

// ドラッグ&ドロップのサポート
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// ファイル選択処理
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// ファイル処理
function handleFile(file) {
    if (!file.name.endsWith('.ipynb')) {
        alert('エラー: .ipynbファイルを選択してください');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const notebook = JSON.parse(e.target.result);
            currentNotebook = notebook;
            displayNotebook(notebook, file.name);
        } catch (error) {
            alert('エラー: Notebookファイルの解析に失敗しました\n' + error.message);
            console.error(error);
        }
    };
    reader.readAsText(file);
}

// サンプルNotebook読み込み
async function loadSampleNotebook() {
    try {
        const response = await fetch('samples/sample.ipynb');
        if (!response.ok) {
            throw new Error('サンプルファイルが見つかりません');
        }
        const notebook = await response.json();
        currentNotebook = notebook;
        displayNotebook(notebook, 'sample.ipynb');
    } catch (error) {
        alert('エラー: サンプルNotebookの読み込みに失敗しました\n' + error.message);
        console.error(error);
    }
}

// Notebook情報の表示
function displayNotebookInfo(notebook, filename) {
    const cellCount = notebook.cells ? notebook.cells.length : 0;
    const codeCount = notebook.cells ? notebook.cells.filter(c => c.cell_type === 'code').length : 0;
    const markdownCount = notebook.cells ? notebook.cells.filter(c => c.cell_type === 'markdown').length : 0;

    infoContent.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">ファイル名:</span>
                <span class="info-value">${filename}</span>
            </div>
            <div class="info-item">
                <span class="info-label">セル数:</span>
                <span class="info-value">${cellCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">コードセル:</span>
                <span class="info-value">${codeCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">マークダウンセル:</span>
                <span class="info-value">${markdownCount}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Kernelspec:</span>
                <span class="info-value">${notebook.metadata?.kernelspec?.display_name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">言語:</span>
                <span class="info-value">${notebook.metadata?.kernelspec?.language || 'N/A'}</span>
            </div>
        </div>
    `;
    notebookInfo.style.display = 'block';
}

// Notebookの表示
function displayNotebook(notebook, filename) {
    displayNotebookInfo(notebook, filename);

    notebookContent.innerHTML = '';

    if (!notebook.cells || notebook.cells.length === 0) {
        notebookContent.innerHTML = '<p class="no-cells">セルが見つかりませんでした</p>';
        return;
    }

    notebook.cells.forEach((cell, index) => {
        const cellElement = createCellElement(cell, index);
        notebookContent.appendChild(cellElement);
    });

    // コードのシンタックスハイライトを適用
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

// セル要素の作成
function createCellElement(cell, index) {
    const cellDiv = document.createElement('div');
    cellDiv.className = `cell cell-${cell.cell_type}`;
    cellDiv.dataset.index = index;

    // セルヘッダー
    const header = document.createElement('div');
    header.className = 'cell-header';
    header.innerHTML = `
        <span class="cell-type">${cell.cell_type === 'code' ? '💻 Code' : '📝 Markdown'}</span>
        <span class="cell-number">[${index + 1}]</span>
    `;
    cellDiv.appendChild(header);

    // セル内容
    const content = document.createElement('div');
    content.className = 'cell-content';

    if (cell.cell_type === 'code') {
        // コードセル
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        const codeBlock = document.createElement('pre');
        const code = document.createElement('code');
        code.className = getLanguageClass(cell);
        code.textContent = source;
        codeBlock.appendChild(code);
        content.appendChild(codeBlock);

        // 出力の表示
        if (cell.outputs && cell.outputs.length > 0) {
            const outputDiv = document.createElement('div');
            outputDiv.className = 'cell-output';
            outputDiv.innerHTML = '<div class="output-label">出力:</div>';

            cell.outputs.forEach(output => {
                outputDiv.appendChild(createOutputElement(output));
            });

            content.appendChild(outputDiv);
        }
    } else if (cell.cell_type === 'markdown') {
        // マークダウンセル
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        const markdownDiv = document.createElement('div');
        markdownDiv.className = 'markdown-content';
        markdownDiv.innerHTML = marked.parse(source);
        content.appendChild(markdownDiv);
    }

    cellDiv.appendChild(content);
    return cellDiv;
}

// 言語クラスの取得
function getLanguageClass(cell) {
    const language = currentNotebook?.metadata?.kernelspec?.language || 'python';
    return `language-${language}`;
}

// 出力要素の作成
function createOutputElement(output) {
    const outputElement = document.createElement('div');
    outputElement.className = 'output-item';

    if (output.output_type === 'stream') {
        // ストリーム出力 (print文など)
        const text = Array.isArray(output.text) ? output.text.join('') : output.text;
        const pre = document.createElement('pre');
        pre.className = 'output-stream';
        pre.textContent = text;
        outputElement.appendChild(pre);
    } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
        // 実行結果や表示データ
        if (output.data) {
            if (output.data['text/html']) {
                // HTML出力
                const htmlContent = Array.isArray(output.data['text/html'])
                    ? output.data['text/html'].join('')
                    : output.data['text/html'];
                const htmlDiv = document.createElement('div');
                htmlDiv.className = 'output-html';
                htmlDiv.innerHTML = htmlContent;
                outputElement.appendChild(htmlDiv);
            } else if (output.data['image/png']) {
                // PNG画像
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + output.data['image/png'];
                img.className = 'output-image';
                outputElement.appendChild(img);
            } else if (output.data['text/plain']) {
                // テキスト出力
                const text = Array.isArray(output.data['text/plain'])
                    ? output.data['text/plain'].join('')
                    : output.data['text/plain'];
                const pre = document.createElement('pre');
                pre.className = 'output-text';
                pre.textContent = text;
                outputElement.appendChild(pre);
            }
        }
    } else if (output.output_type === 'error') {
        // エラー出力
        const errorDiv = document.createElement('div');
        errorDiv.className = 'output-error';
        const traceback = output.traceback ? output.traceback.join('\n') : '';
        errorDiv.textContent = `${output.ename}: ${output.evalue}\n${traceback}`;
        outputElement.appendChild(errorDiv);
    }

    return outputElement;
}
