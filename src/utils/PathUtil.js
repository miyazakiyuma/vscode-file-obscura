const vscode = require('vscode');
const path = require('path');

/**
 * パス処理ユーティリティ
 */

/**
 * ワークスペースルートからの相対パスを取得
 * @param {vscode.Uri} uri
 * @returns {string} 相対パス（スラッシュ区切り）
 */
function getRelativePath(uri) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return uri.fsPath;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    let relativePath = path.relative(workspaceRoot, uri.fsPath).replace(/\\/g, '/');

    // ルートディレクトリのファイルの場合、明示的に./を追加
    // これによりファイル名のみのパターンと区別する
    if (!relativePath.includes('/')) {
        relativePath = './' + relativePath;
    }

    return relativePath;
}

/**
 * ファイル名を取得
 * @param {vscode.Uri} uri
 * @returns {string}
 */
function getFileName(uri) {
    return path.basename(uri.fsPath);
}

/**
 * ファイル拡張子を取得
 * @param {vscode.Uri} uri
 * @returns {string}
 */
function getFileExtension(uri) {
    return path.extname(getFileName(uri));
}

module.exports = {
    getRelativePath,
    getFileName,
    getFileExtension
};

