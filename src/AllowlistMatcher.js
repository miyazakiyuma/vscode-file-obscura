const vscode = require('vscode');
const { minimatch } = require('minimatch');
const path = require('path');
const { getRelativePath } = require('./utils/PathUtil');

/**
 * 許可リストパターンマッチングクラス
 */
class AllowlistMatcher {
    /**
     * ファイルが許可リストに一致するかどうかを判定
     * @param {vscode.Uri} uri
     * @param {string[]} allowlist 許可リストパターンの配列
     * @returns {boolean} 一致する場合true（マスクしない）、一致しない場合false（マスクする）
     */
    matches(uri, allowlist) {
        const fileName = path.basename(uri.fsPath);
        const filePath = uri.fsPath;
        const relativeFilePath = getRelativePath(uri);

        // パターンが許可リストと一致するかチェック
        for (const pattern of allowlist) {
            try {
                let matches = false;

                // ./で始まるパターンは相対パスとして厳密にマッチ
                if (pattern.startsWith('./')) {
                    const patternWithoutDot = pattern.substring(2); // ./を削除
                    matches = minimatch(relativeFilePath, patternWithoutDot, { dot: true }) ||
                        minimatch(relativeFilePath, pattern, { dot: true });
                } 
                // スラッシュを含むパターンは相対パスとしてマッチを試みる
                else if (pattern.includes('/')) {
                    // 相対パスとしてマッチを試みる
                    matches = minimatch(relativeFilePath, pattern, { dot: true }) ||
                        minimatch(relativeFilePath, './' + pattern, { dot: true });
                    // 絶対パスでも試す
                    if (!matches) {
                        matches = minimatch(filePath, pattern, { matchBase: true, dot: true });
                    }
                } 
                // ファイル名のみのパターンは絶対パスとファイル名の両方に対してマッチ
                else {
                    const filePathMatches = minimatch(filePath, pattern, { matchBase: true, dot: true });
                    const fileNameMatches = minimatch(fileName, pattern, { matchBase: true, dot: true });
                    matches = filePathMatches || fileNameMatches;
                }

                if (matches) {
                    return true; // 許可リストに含まれているためマスクしない
                }
            } catch (error) {
                console.error(`[File Obscura] Error evaluating pattern ${pattern}:`, error);
            }
        }

        return false; // パターンが一致しない場合はマスクする
    }
}

module.exports = AllowlistMatcher;

