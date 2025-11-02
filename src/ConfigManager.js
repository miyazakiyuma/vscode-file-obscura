const vscode = require('vscode');
const { getLocalizedQuickPickTexts } = require('./Localization');
const { getLanguage } = require('./utils/LanguageUtil');
const { getRelativePath, getFileName, getFileExtension } = require('./utils/PathUtil');
const AllowlistMatcher = require('./AllowlistMatcher');

/**
 * 設定管理クラス（許可リストモード）
 */
class ConfigManager {
    constructor() {
        this.config = null;
        this.allowlistCache = null; // 許可リストのキャッシュ
        this.matcher = new AllowlistMatcher(); // パターンマッチング用
        this.temporaryDisabled = false; // 一時的な無効化状態（メモリ内のみ）
        this.updateConfig();

        // 設定変更を監視
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('fileObscura')) {
                this.updateConfig();
            }
        });
    }

    /**
     * 設定を更新
     */
    updateConfig() {
        this.config = vscode.workspace.getConfiguration('fileObscura');
        this.allowlistCache = null; // キャッシュをクリア
    }

    /**
     * マスク機能が有効かどうかをチェック
     * 一時的な無効化状態も考慮する
     */
    isEnabled() {
        // 一時的な無効化状態が有効な場合は無効
        if (this.temporaryDisabled) {
            return false;
        }
        return this.config.get('enabled', true);
    }

    /**
     * 一時的な無効化状態を設定（メモリ内のみ、次回起動時にはリセットされる）
     * @param {boolean} disabled 無効化する場合はtrue
     */
    setTemporaryDisabled(disabled) {
        this.temporaryDisabled = disabled;
    }

    /**
     * 一時的な無効化状態を取得
     * @returns {boolean} 一時的に無効化されている場合はtrue
     */
    isTemporarilyDisabled() {
        return this.temporaryDisabled;
    }

    /**
     * 表示タイムアウトを分単位で取得
     */
    getRevealTimeout() {
        return this.config.get('revealTimeout', 5);
    }

    /**
     * 許可リストを取得
     * ワークスペース設定を優先し、結果をキャッシュ
     * @param {vscode.Uri} uri リソースURI（scope: "resource"のため必要）
     */
    getAllowlist(uri = null) {
        // scope: "resource"の場合、URIを使用して設定を読み込む
        // URIが指定されない場合は、ワークスペースのルートフォルダーのURIを使用
        const resourceUri = uri || (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 
            ? vscode.workspace.workspaceFolders[0].uri 
            : null);
        
        // リソースURIを使用して設定を取得
        const config = resourceUri 
            ? vscode.workspace.getConfiguration('fileObscura', resourceUri)
            : this.config;
        
        // ワークスペース設定から取得を試みる
        const inspection = config.inspect('allowlist');

        // ワークスペース設定を優先（workspaceFolderValue と workspaceValue の両方をチェック）
        let allowlist = null;
        if (inspection) {
            // ワークスペースフォルダー設定を最優先
            if (inspection.workspaceFolderValue !== undefined) {
                const list = inspection.workspaceFolderValue;
                if (Array.isArray(list)) {
                    allowlist = list;
                }
            }
            // 次にワークスペース設定をチェック
            else if (inspection.workspaceValue !== undefined) {
                const list = inspection.workspaceValue;
                if (Array.isArray(list)) {
                    allowlist = list;
                }
            }
        }

        // ワークスペース設定が存在しない場合は、設定の優先順位に従って取得
        if (allowlist === null) {
            allowlist = config.get('allowlist', []);
        }

        if (!Array.isArray(allowlist)) {
            console.warn('[File Obscura] fileObscura.allowlist is not an array. Using empty array.');
            this.allowlistCache = [];
            return [];
        }

        // URIが指定された場合はキャッシュしない（リソースごとに異なる可能性があるため）
        if (uri) {
            return allowlist;
        }

        // URIが指定されない場合のみキャッシュ
        this.allowlistCache = allowlist;
        return allowlist;
    }

    /**
     * ファイルをマスクすべきかどうかを判定（許可リストモード）
     * 許可リストに含まれていないファイルはマスクされる
     */
    shouldMaskFile(uri) {
        // マスク機能が無効な場合はマスクしない
        if (!this.isEnabled()) {
            return false;
        }

        // URIを指定して許可リストを取得（scope: "resource"のため）
        const allowlist = this.getAllowlist(uri);

        // 許可リストが空の場合はすべてマスク
        if (allowlist.length === 0) {
            return true;
        }

        // パターンマッチングを実行
        // matches()がtrueを返す = 許可リストに含まれている = マスクしない（false）
        // matches()がfalseを返す = 許可リストに含まれていない = マスクする（true）
        return !this.matcher.matches(uri, allowlist);
    }


    /**
     * ファイルを許可リストに追加（ワークスペース設定に保存）
     * ユーザーに追加方法を選択させる
     */
    async addToAllowlist(uri) {
        try {
            // URIを指定して許可リストを取得（scope: "resource"のため）
            const currentAllowlist = this.getAllowlist(uri);
            const fileName = getFileName(uri);
            const relativePath = getRelativePath(uri);

            // 言語設定を取得
            const language = getLanguage();
            const texts = getLocalizedQuickPickTexts(language);
            const extension = getFileExtension(uri);

            // ユーザーにオプションを提示（推奨オプションを最初に）
            const choice = await vscode.window.showQuickPick([
                {
                    label: `${texts.RELATIVE_PATH_LABEL}: ${relativePath}`,
                    description: texts.RELATIVE_PATH_DESC,
                    value: relativePath,
                    detail: `${texts.EXAMPLE}: ${relativePath} (${texts.RELATIVE_PATH_DETAIL})`
                },
                {
                    label: `${texts.EXTENSION_LABEL}: *${extension}`,
                    description: typeof texts.EXTENSION_DESC === 'function' ? texts.EXTENSION_DESC(extension) : texts.EXTENSION_DESC,
                    value: `*${extension}`,
                    detail: `${texts.EXAMPLE}: *${extension} (${typeof texts.EXTENSION_DETAIL === 'function' ? texts.EXTENSION_DETAIL(extension) : texts.EXTENSION_DETAIL})`
                }
            ], {
                placeHolder: texts.PLACEHOLDER,
                title: texts.TITLE
            });

            if (!choice) {
                return { success: false, cancelled: true };
            }

            const patternToAdd = choice.value;

            // 既に含まれているかチェック
            if (currentAllowlist.includes(patternToAdd)) {
                vscode.window.showInformationMessage(`${patternToAdd} ${texts.ALREADY_EXISTS}`);
                return { success: true, alreadyExists: true };
            }

            // 新しい許可リストを作成
            const newAllowlist = [...currentAllowlist, patternToAdd];

            // ワークスペース設定に保存
            // scope: "resource"の場合でも、Workspaceスコープで保存することで
            // ワークスペース全体に適用される
            await this.config.update(
                'allowlist',
                newAllowlist,
                vscode.ConfigurationTarget.Workspace
            );

            // キャッシュをクリア（次回取得時に再読み込み）
            this.allowlistCache = null;

            return { success: true, alreadyExists: false, pattern: patternToAdd };

        } catch (error) {
            console.error('[File Obscura] Failed to add to allowlist:', error);
            throw error;
        }
    }

}

module.exports = ConfigManager;

