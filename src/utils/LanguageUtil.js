const vscode = require('vscode');

/**
 * 言語判定ユーティリティ
 */

/**
 * 現在の言語設定を取得
 * @returns {string} 'ja' または 'en'
 */
function getLanguage() {
    return vscode.env.language === 'ja' ? 'ja' : 'en';
}

module.exports = {
    getLanguage
};

