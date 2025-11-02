/**
 * File Obscura拡張機能のローカライズユーティリティ
 */

/**
 * QuickPick用のローカライズされたテキストを取得（許可リスト追加）
 * @param {string} language - 言語コード ('ja' または 'en')
 * @returns {Object} ローカライズされたテキストオブジェクト
 */
function getLocalizedQuickPickTexts(language) {
    const texts = {
        ja: {
            RELATIVE_PATH_LABEL: '📂 相対パス',
            RELATIVE_PATH_DESC: 'このファイルだけを許可（推奨）',
            RELATIVE_PATH_DETAIL: 'このファイルのみ',
            EXTENSION_LABEL: '🌟 拡張子',
            EXTENSION_DESC: (ext) => `全ての${ext}ファイルを許可`,
            EXTENSION_DETAIL: (ext) => `全ての${ext}ファイル`,
            PLACEHOLDER: '追加方法を選択',
            TITLE: '許可リストに追加',
            ALREADY_EXISTS: 'は既に許可リストに含まれています',
            EXAMPLE: '例'
        },
        en: {
            RELATIVE_PATH_LABEL: '📂 Relative Path',
            RELATIVE_PATH_DESC: 'Allow this file only (Recommended)',
            RELATIVE_PATH_DETAIL: 'This file only',
            EXTENSION_LABEL: '🌟 File Extension',
            EXTENSION_DESC: (ext) => `Allow all ${ext} files`,
            EXTENSION_DETAIL: (ext) => `all ${ext} files`,
            PLACEHOLDER: 'Select how to add',
            TITLE: 'Add to Allowlist',
            ALREADY_EXISTS: 'is already included in the allowlist',
            EXAMPLE: 'Example'
        }
    };

    return texts[language] || texts.en;
}

/**
 * ローカライズされたエラーメッセージを取得
 * @param {string} language - 言語コード ('ja' または 'en')
 * @returns {Object} ローカライズされたエラーメッセージオブジェクト
 */
function getLocalizedErrorMessages(language) {
    const messages = {
        ja: {
            ACTIVATION_FAILED: 'File Obscura拡張機能の初期化に失敗しました',
            FILE_OPEN_FAILED: 'ファイルを開けませんでした',
            FILE_READ_FAILED: 'ファイルの読み込みに失敗しました',
            ALLOWLIST_ADD_FAILED: '許可リストへの追加に失敗しました',
            ERROR_OCCURRED: 'エラーが発生しました',
            ERROR_OCCURRED_DESC: 'ファイルを開く際にエラーが発生しました。'
        },
        en: {
            ACTIVATION_FAILED: 'File Obscura extension initialization failed',
            FILE_OPEN_FAILED: 'Failed to open file',
            FILE_READ_FAILED: 'Failed to read file',
            ALLOWLIST_ADD_FAILED: 'Failed to add to allowlist',
            ERROR_OCCURRED: 'An error occurred',
            ERROR_OCCURRED_DESC: 'An error occurred while opening the file.'
        }
    };

    return messages[language] || messages.en;
}

/**
 * ローカライズされた情報メッセージを取得
 * @param {string} language - 言語コード ('ja' または 'en')
 * @returns {Object} ローカライズされた情報メッセージオブジェクト
 */
function getLocalizedInfoMessages(language) {
    const messages = {
        ja: {
            ALLOWLIST_ADDED: '✅ 許可リストに追加しました'
        },
        en: {
            ALLOWLIST_ADDED: '✅ Added to allowlist'
        }
    };

    return messages[language] || messages.en;
}

/**
 * webview用のローカライズされたテキストを取得
 * @param {string} language - 言語コード ('ja' または 'en')
 * @returns {Object} ローカライズされたテキストオブジェクト
 */
function getLocalizedWebviewTexts(language) {
    const texts = {
        ja: {
            WARNING_MESSAGE: '⚠️ このファイルは保護されています',
            LINES: '行',
            BYTES: 'バイト',
            PROTECTED_BY_ALLOWLIST: 'Allowlist方式で保護中',
            PROTECTED_DESCRIPTION: 'このファイルは許可リストに含まれていないため、保護されています。',
            OPTIONS: '選択肢：',
            TEMPORARY_SHOW: '一時的に表示：下のボタンで今回だけ表示',
            ADD_TO_ALLOWLIST: '許可リストに追加：次回から自動的に表示（推奨）',
            ADD_TO_ALLOWLIST_TITLE: '許可リストに追加する（推奨）',
            ADD_TO_ALLOWLIST_DESC: 'このファイルを安全なファイルとしてマークします。次回から自動的に開きます。',
            ADD_TO_ALLOWLIST_BUTTON: '許可リストに追加して開く',
            TEMPORARY_SHOW_TITLE: '一時的に表示する',
            TEMPORARY_SHOW_DESC: '今回のみ内容を表示します。次回も同じ確認が必要です。',
            CONFIRM_CHECKBOX: '表示する前に確認しました',
            REVEAL_BUTTON: '今回だけ表示する',
            FOOTER_TEXT: 'File Obscura Extension'
        },
        en: {
            WARNING_MESSAGE: '⚠️ This file is protected',
            LINES: 'lines',
            BYTES: 'bytes',
            PROTECTED_BY_ALLOWLIST: 'Protected by Allowlist',
            PROTECTED_DESCRIPTION: 'This file is protected because it is not included in the allowlist.',
            OPTIONS: 'Options:',
            TEMPORARY_SHOW: 'Temporary display: Use the button below to show this time only',
            ADD_TO_ALLOWLIST: 'Add to allowlist: Automatically show from next time (Recommended)',
            ADD_TO_ALLOWLIST_TITLE: 'Add to Allowlist (Recommended)',
            ADD_TO_ALLOWLIST_DESC: 'Mark this file as safe. It will open automatically from next time.',
            ADD_TO_ALLOWLIST_BUTTON: 'Add to Allowlist and Open',
            TEMPORARY_SHOW_TITLE: 'Temporary Display',
            TEMPORARY_SHOW_DESC: 'Display content this time only. The same confirmation will be required next time.',
            CONFIRM_CHECKBOX: 'I have confirmed before displaying',
            REVEAL_BUTTON: 'Show This Time Only',
            FOOTER_TEXT: 'File Obscura Extension'
        }
    };

    return texts[language] || texts.en;
}

/**
 * StatusBar用のローカライズされたテキストを取得
 * @param {string} language - 言語コード ('ja' または 'en')
 * @returns {Object} ローカライズされたテキストオブジェクト
 */
function getLocalizedStatusBarTexts(language) {
    const texts = {
        ja: {
            MASKING_ENABLED: '$(lock) 有効',
            MASKING_DISABLED: '$(unlock) 無効',
            TOGGLE_MASKING: 'ファイルマスク機能の一時オン/オフ'
        },
        en: {
            MASKING_ENABLED: '$(lock) On',
            MASKING_DISABLED: '$(unlock) Off',
            TOGGLE_MASKING: 'Toggle file masking feature temporarily'
        }
    };

    return texts[language] || texts.en;
}

module.exports = {
    getLocalizedQuickPickTexts,
    getLocalizedErrorMessages,
    getLocalizedInfoMessages,
    getLocalizedWebviewTexts,
    getLocalizedStatusBarTexts
};

