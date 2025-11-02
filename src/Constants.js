/**
 * 拡張機能で使用する定数
 */

// コマンド名
const COMMANDS = {
    REVEAL_FILE: 'fileObscura.revealFile',
    IS_REVEALED: 'fileObscura.isRevealed'
};

// Custom EditorのviewType
const CUSTOM_EDITOR_VIEW_TYPE = 'fileObscura.maskedEditor';

// タイムアウト値（ミリ秒）
const TIMEOUTS = {
    WEBVIEW_DISPOSE_DELAY: 50,        // webviewPanelを閉じる際の遅延
    FILE_PROTECTION_DURATION: 500      // ファイル保護期間（エディタ切り替え時の誤検出防止）
};

// URIスキーム
const URI_SCHEMES = {
    FILE: 'file'
};

module.exports = {
    COMMANDS,
    CUSTOM_EDITOR_VIEW_TYPE,
    TIMEOUTS,
    URI_SCHEMES
};

