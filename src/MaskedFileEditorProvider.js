const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;
const { getLocalizedErrorMessages, getLocalizedInfoMessages, getLocalizedWebviewTexts } = require('./Localization');
const { COMMANDS, TIMEOUTS } = require('./Constants');
const { getLanguage } = require('./utils/LanguageUtil');
const { getFileName } = require('./utils/PathUtil');

class MaskedFileEditorProvider {
    constructor(context, configManager) {
        this.context = context;
        this.configManager = configManager;
        this.htmlTemplateCache = null;
    }

    async openCustomDocument(uri, _openContext, _token) {
        return {
            uri,
            dispose: () => { }
        };
    }

    async resolveCustomEditor(document, webviewPanel, _token) {
        try {
            // 表示済みリストまたは許可リストに含まれているかチェック
            const isRevealed = await vscode.commands.executeCommand(COMMANDS.IS_REVEALED, document.uri);
            const shouldMask = this.configManager.shouldMaskFile(document.uri);

            if (isRevealed || !shouldMask) {
                // タブが既に開いているかチェック
                const existingEditor = vscode.window.visibleTextEditors.find(
                    editor => editor.document.uri.toString() === document.uri.toString() &&
                        editor.document.uri.scheme === 'file'
                );

                if (existingEditor) {
                    // 既存のタブにフォーカス
                    await vscode.window.showTextDocument(existingEditor.document, {
                        preview: false,
                        viewColumn: existingEditor.viewColumn,
                        preserveFocus: false
                    });

                    // カスタムエディタを閉じる
                    this.disposeWebviewPanel(webviewPanel);

                    return;
                }

                // viewColumnを保存（webviewが閉じる前）
                const targetColumn = webviewPanel.viewColumn || vscode.ViewColumn.One;

                // ファイルをテキストエディタで開く
                await this.openFileInTextEditor(document.uri, targetColumn, true);

                // 短い遅延の後にカスタムエディタを閉じる
                this.disposeWebviewPanel(webviewPanel);

                return;
            }

            webviewPanel.webview.options = {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'templates'))
                ]
            };

            const fileContent = await this.readFileContent(document.uri);
            webviewPanel.webview.html = await this.getWebviewContent(document.uri, fileContent);

            // webviewからのメッセージを処理
            webviewPanel.webview.onDidReceiveMessage(
                async message => {
                    await this.handleMessage(message, document, webviewPanel);
                }
            );
        } catch (error) {
            console.error('[File Obscura] Error resolving custom editor:', error);
            this.showErrorMessage(error, 'FILE_OPEN_FAILED');
        }
    }

    /**
     * ファイル内容を読み込む
     */
    async readFileContent(uri) {
        try {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            return Buffer.from(fileContent).toString('utf8');
        } catch (error) {
            console.error('[File Obscura] Failed to read file:', error);
            const language = getLanguage();
            const errorMessages = getLocalizedErrorMessages(language);
            throw new Error(`${errorMessages.FILE_READ_FAILED}: ${error.message}`);
        }
    }

    /**
     * webviewからのメッセージを処理
     */
    async handleMessage(message, document, webviewPanel) {
        switch (message.command) {
            case 'reveal':
                try {
                    // viewColumnを保存（webviewが閉じる前）
                    const targetColumn = webviewPanel.viewColumn;

                    // ファイルをテキストエディタで開く
                    await this.openFileInTextEditor(document.uri, targetColumn, true);

                    // 短い遅延の後にカスタムエディタを閉じる
                    this.disposeWebviewPanel(webviewPanel);

                } catch (error) {
                    console.error('[File Obscura] Error displaying file:', error);
                    this.showErrorMessage(error, 'FILE_OPEN_FAILED');
                }
                break;

            case 'addToAllowlist':
                try {
                    const fileName = getFileName(document.uri);
                    const result = await this.configManager.addToAllowlist(document.uri);

                    // キャンセルされた場合
                    if (result.cancelled) {
                        return;
                    }

                    if (result.success) {
                        if (!result.alreadyExists) {
                            const language = getLanguage();
                            const infoMessages = getLocalizedInfoMessages(language);
                            vscode.window.showInformationMessage(
                                `${infoMessages.ALLOWLIST_ADDED}: ${result.pattern || fileName}`
                            );
                        }

                        // viewColumnを保存（webviewが閉じる前）
                        const targetColumn = webviewPanel.viewColumn;

                        // ファイルをテキストエディタで開く（表示済みリストにも追加）
                        await this.openFileInTextEditor(document.uri, targetColumn, true);

                        // 短い遅延の後にカスタムエディタを閉じる
                        this.disposeWebviewPanel(webviewPanel);
                    }
                } catch (error) {
                    console.error('[File Obscura] Error adding to allowlist:', error);
                    this.showErrorMessage(error, 'ALLOWLIST_ADD_FAILED');
                }
                break;

            default:
                console.warn(`[File Obscura] Unknown command: ${message.command}`);
        }
    }

    /**
     * webviewコンテンツを生成
     */
    async getWebviewContent(uri, content) {
        try {
            // HTMLテンプレートをキャッシュから取得（初回のみファイルを読み込む）
            if (!this.htmlTemplateCache) {
                const templatePath = path.join(this.context.extensionPath, 'src', 'templates', 'maskedView.html');
                this.htmlTemplateCache = await fs.readFile(templatePath, 'utf8');
            }

            // キャッシュからテンプレートを取得
            let html = this.htmlTemplateCache;

            // 言語設定を取得
            const language = getLanguage();

            // プレースホルダーを置換
            const fileName = getFileName(uri);
            const lineCount = content.split('\n').length;

            // ローカライズされたテキストを取得
            const texts = getLocalizedWebviewTexts(language);

            html = html.replace('{{WARNING_MESSAGE}}', this.escapeHtml(texts.WARNING_MESSAGE));
            html = html.replace('{{FILE_NAME}}', this.escapeHtml(fileName));
            html = html.replace('{{LINE_COUNT}}', lineCount.toString());
            html = html.replace('{{FILE_SIZE}}', content.length.toString());
            html = html.replace('{{LANGUAGE}}', language);

            // ローカライズされたテキストを置換（既に置換済みのWARNING_MESSAGEを除く）
            Object.keys(texts).forEach(key => {
                if (key !== 'WARNING_MESSAGE') {
                    html = html.replace(new RegExp(`{{${key}}}`, 'g'), texts[key]);
                }
            });

            return html;
        } catch (error) {
            console.error('[File Obscura] Failed to generate webview content:', error);
            return this.getErrorHtml(error);
        }
    }

    /**
     * webviewPanelを安全に閉じる
     * @param {vscode.WebviewPanel} webviewPanel
     * @param {number} delay 遅延時間（ミリ秒、デフォルト: TIMEOUTS.WEBVIEW_DISPOSE_DELAY）
     */
    disposeWebviewPanel(webviewPanel, delay = TIMEOUTS.WEBVIEW_DISPOSE_DELAY) {
        setTimeout(() => {
            try {
                webviewPanel.dispose();
            } catch (e) {
                // 既に閉じられている
            }
        }, delay);
    }

    /**
     * ファイルをテキストエディタで開く
     * @param {vscode.Uri} uri
     * @param {vscode.ViewColumn} viewColumn
     * @param {boolean} addToRevealedList 表示済みリストに追加するか
     * @returns {Promise<void>}
     */
    async openFileInTextEditor(uri, viewColumn, addToRevealedList = true) {
        // 表示済みリストに追加
        if (addToRevealedList) {
            await vscode.commands.executeCommand(COMMANDS.REVEAL_FILE, uri);
        }

        // 通常のテキストエディタで開く
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: viewColumn
        });
    }

    /**
     * エラーメッセージを表示
     * @param {Error} error
     * @param {string} errorKey エラーメッセージのキー
     */
    showErrorMessage(error, errorKey) {
        const language = getLanguage();
        const errorMessages = getLocalizedErrorMessages(language);
        vscode.window.showErrorMessage(`${errorMessages[errorKey]}: ${error.message}`);
    }

    /**
     * HTMLをエスケープ
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * エラー用のHTMLを生成
     */
    getErrorHtml(error) {
        const language = getLanguage();
        const errorMessages = getLocalizedErrorMessages(language);

        return `<!DOCTYPE html>
<html lang="${language}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Error</title>
<style>body{font-family:var(--vscode-font-family);padding:40px;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground)}.error{padding:20px;background:var(--vscode-inputValidation-errorBackground);border:1px solid var(--vscode-inputValidation-errorBorder);border-radius:4px}h1{color:var(--vscode-errorForeground);margin:0}</style>
</head>
<body><div class="error"><h1>⚠️ ${this.escapeHtml(errorMessages.ERROR_OCCURRED)}</h1><p>${this.escapeHtml(errorMessages.ERROR_OCCURRED_DESC)}</p><pre>${this.escapeHtml(error.message)}</pre></div></body></html>`;
    }
}

module.exports = MaskedFileEditorProvider;

