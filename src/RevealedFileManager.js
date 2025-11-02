const vscode = require('vscode');
const { TIMEOUTS, URI_SCHEMES } = require('./Constants');

/**
 * 表示済みファイルの状態を管理するクラス
 */
class RevealedFileManager {
    constructor(configManager) {
        this.configManager = configManager;
        this.revealedFiles = new Set(); // 表示されたファイルのパスを記憶
        this.revealTimers = new Map(); // タイマーIDを管理（メモリリーク防止）
        this.protectedFiles = new Set(); // 一時的に保護されているファイルのセット

        // エディタ状態の監視を開始
        this.startEditorMonitoring();
    }

    /**
     * ファイルを表示済みリストに追加
     * @param {vscode.Uri} uri
     */
    addRevealedFile(uri) {
        const key = uri.toString();
        this.revealedFiles.add(key);

        // 一時的に保護（エディタ切り替え時の誤検出を防止）
        this.protectedFiles.add(key);
        setTimeout(() => {
            this.protectedFiles.delete(key);
        }, TIMEOUTS.FILE_PROTECTION_DURATION);

        // 既存のタイマーがあればクリア
        if (this.revealTimers.has(key)) {
            clearTimeout(this.revealTimers.get(key));
        }

        // 設定されたタイムアウト後に自動的にリストから削除（再マスクが必要になる）
        const timeoutMinutes = this.configManager.getRevealTimeout();
        const timerId = setTimeout(() => {
            if (this.revealedFiles.has(key)) {
                this.revealedFiles.delete(key);
                this.revealTimers.delete(key);
            }
        }, timeoutMinutes * 60 * 1000);

        this.revealTimers.set(key, timerId);
    }

    /**
     * ファイルが表示済みかどうかをチェック
     * @param {vscode.Uri} uri
     * @returns {boolean}
     */
    isRevealed(uri) {
        const key = uri.toString();
        return this.revealedFiles.has(key);
    }

    /**
     * ファイルを表示済みリストから削除
     * @param {vscode.Uri} uri
     */
    removeRevealedFile(uri) {
        const key = uri.toString();
        this.revealedFiles.delete(key);

        // タイマーをクリア（メモリリーク防止）
        if (this.revealTimers.has(key)) {
            clearTimeout(this.revealTimers.get(key));
            this.revealTimers.delete(key);
        }
    }

    /**
     * 表示中のエディタを追跡し、閉じられたファイルを検出
     */
    checkForClosedEditors() {
        const currentVisibleEditors = new Set(
            vscode.window.visibleTextEditors
                .filter(editor => editor.document.uri.scheme === URI_SCHEMES.FILE)
                .map(editor => editor.document.uri.toString())
        );

        // すべての開いているドキュメント（非表示のものも含む）
        const allOpenDocuments = new Set(
            vscode.workspace.textDocuments
                .filter(doc => doc.uri.scheme === URI_SCHEMES.FILE)
                .map(doc => doc.uri.toString())
        );

        // 以前は表示されていたが現在は表示されていないエディタを検出
        for (const key of this.revealedFiles) {
            // 保護期間中のファイルはスキップ
            if (this.protectedFiles.has(key)) {
                continue;
            }

            // 非表示でもドキュメントがまだ開いている場合はスキップ
            if (allOpenDocuments.has(key)) {
                continue;
            }

            if (!currentVisibleEditors.has(key)) {
                this.revealedFiles.delete(key);

                // タイマーをクリア（メモリリーク防止）
                if (this.revealTimers.has(key)) {
                    clearTimeout(this.revealTimers.get(key));
                    this.revealTimers.delete(key);
                }
            }
        }
    }

    /**
     * エディタ状態の監視を開始
     */
    startEditorMonitoring() {
        // 表示中のエディタが変更されたときにチェック
        // onDidCloseTextDocumentは信頼できないため、onDidChangeVisibleTextEditorsのみを使用
        vscode.window.onDidChangeVisibleTextEditors(() => {
            this.checkForClosedEditors();
        });
    }

    /**
     * マスクすべきファイルを表示済みリストから削除
     * マスク機能が有効化されたときに呼び出される
     */
    clearMaskedFiles() {
        const filesToRemove = [];
        
        // すべての表示済みファイルをチェック
        for (const fileKey of this.revealedFiles) {
            try {
                const uri = vscode.Uri.parse(fileKey);
                // マスクすべきファイルかチェック
                if (this.configManager.shouldMaskFile(uri)) {
                    filesToRemove.push(fileKey);
                }
            } catch (error) {
                // URIのパースに失敗した場合は削除対象に追加
                console.warn(`[File Obscura] Failed to parse URI: ${fileKey}`, error);
                filesToRemove.push(fileKey);
            }
        }

        // マスクすべきファイルをリストから削除
        for (const fileKey of filesToRemove) {
            const uri = vscode.Uri.parse(fileKey);
            this.removeRevealedFile(uri);
        }
    }

    /**
     * クリーンアップ（すべてのタイマーをクリア）
     */
    dispose() {
        // すべてのタイマーをクリア
        for (const timerId of this.revealTimers.values()) {
            clearTimeout(timerId);
        }
        this.revealTimers.clear();
        this.revealedFiles.clear();
        this.protectedFiles.clear();
    }
}

module.exports = RevealedFileManager;

