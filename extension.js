const vscode = require('vscode');
const ConfigManager = require('./src/ConfigManager');
const MaskedFileEditorProvider = require('./src/MaskedFileEditorProvider');
const RevealedFileManager = require('./src/RevealedFileManager');
const { getLocalizedErrorMessages, getLocalizedStatusBarTexts } = require('./src/Localization');
const { COMMANDS, CUSTOM_EDITOR_VIEW_TYPE } = require('./src/Constants');
const { getLanguage } = require('./src/utils/LanguageUtil');

/**
 * 拡張機能の有効化
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    console.log('🔒 [File Obscura] Activating extension...');

    try {
        const configManager = new ConfigManager();

        // 表示済みファイルの状態管理
        const revealedFileManager = new RevealedFileManager(configManager);

        // カスタムエディタプロバイダーの登録
        const provider = new MaskedFileEditorProvider(context, configManager);

        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(CUSTOM_EDITOR_VIEW_TYPE, provider, {
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            })
        );

        // MaskedFileEditorProviderがファイルを表示するときのグローバルコマンドを登録
        context.subscriptions.push(
            vscode.commands.registerCommand(COMMANDS.REVEAL_FILE, async (uri) => {
                revealedFileManager.addRevealedFile(uri);
            })
        );

        // 表示されているかどうかをチェックするコマンド
        context.subscriptions.push(
            vscode.commands.registerCommand(COMMANDS.IS_REVEALED, (uri) => {
                return revealedFileManager.isRevealed(uri);
            })
        );

        // StatusBarアイテムを作成（一時的なオン/オフボタン）
        const language = getLanguage();
        const statusBarTexts = getLocalizedStatusBarTexts(language);
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100 // 優先度（右側の下部に表示）
        );
        
        // 初期状態を設定
        updateStatusBarItem(statusBarItem, configManager, statusBarTexts);
        statusBarItem.show();

        // StatusBarアイテムのクリックイベントを登録
        const toggleCommand = vscode.commands.registerCommand('fileObscura.toggleMasking', async () => {
            const currentState = configManager.isTemporarilyDisabled();
            const newState = !currentState;
            configManager.setTemporaryDisabled(newState);
            
            // マスク機能が有効化されたとき（無効化状態から有効化状態に戻ったとき）
            if (currentState && !newState) {
                // マスクすべきファイルを表示済みリストから削除
                revealedFileManager.clearMaskedFiles();
                
                // 開いているファイルをチェックして、マスクすべきファイルをマスクビューに切り替え
                const visibleEditors = vscode.window.visibleTextEditors.filter(
                    editor => editor.document.uri.scheme === 'file'
                );
                
                // マスクすべきファイルを収集
                const editorsToClose = [];
                for (const editor of visibleEditors) {
                    if (configManager.shouldMaskFile(editor.document.uri)) {
                        editorsToClose.push({
                            uri: editor.document.uri,
                            viewColumn: editor.viewColumn
                        });
                    }
                }
                
                // 各ファイルを閉じて、マスクビューで開く
                for (const fileInfo of editorsToClose) {
                    try {
                        // 特定のエディタを閉じる
                        await vscode.window.showTextDocument(fileInfo.uri, { preview: false });
                        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        // 短い遅延を追加
                        await new Promise(resolve => setTimeout(resolve, 100));
                        // カスタムエディタで開く（マスクビュー）
                        await vscode.commands.executeCommand(
                            'vscode.openWith',
                            fileInfo.uri,
                            CUSTOM_EDITOR_VIEW_TYPE
                        );
                    } catch (error) {
                        console.error(`[File Obscura] Failed to switch to masked view for ${fileInfo.uri.toString()}:`, error);
                    }
                }
            }
            
            // 最新の言語設定を取得して更新
            const currentLanguage = getLanguage();
            const currentStatusBarTexts = getLocalizedStatusBarTexts(currentLanguage);
            updateStatusBarItem(statusBarItem, configManager, currentStatusBarTexts);
        });
        
        statusBarItem.command = 'fileObscura.toggleMasking';
        context.subscriptions.push(statusBarItem);
        context.subscriptions.push(toggleCommand);

        // クリーンアップ時にRevealedFileManagerも破棄
        context.subscriptions.push({
            dispose: () => {
                revealedFileManager.dispose();
            }
        });

        console.log('✅ [File Obscura] Extension activation completed');

    } catch (error) {
        console.error('❌ [File Obscura] Extension activation failed:', error);
        const language = getLanguage();
        const errorMessages = getLocalizedErrorMessages(language);
        vscode.window.showErrorMessage(`${errorMessages.ACTIVATION_FAILED}: ${error.message}`);
    }
}

/**
 * StatusBarアイテムを更新
 * @param {vscode.StatusBarItem} statusBarItem 
 * @param {ConfigManager} configManager 
 * @param {Object} statusBarTexts 
 */
function updateStatusBarItem(statusBarItem, configManager, statusBarTexts) {
    const isTemporarilyDisabled = configManager.isTemporarilyDisabled();
    if (isTemporarilyDisabled) {
        statusBarItem.text = statusBarTexts.MASKING_DISABLED;
        statusBarItem.tooltip = statusBarTexts.TOGGLE_MASKING;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
        statusBarItem.text = statusBarTexts.MASKING_ENABLED;
        statusBarItem.tooltip = statusBarTexts.TOGGLE_MASKING;
        statusBarItem.backgroundColor = undefined;
    }
}

function deactivate() {
    console.log('🔒 [File Obscura] Extension deactivated');
}

module.exports = {
    activate,
    deactivate
};


