# File Obscura

Protects files with allowlist mode. Files not included in the allowlist are automatically masked and can be displayed after confirmation.

This extension was created to prevent accidentally exposing tokens in `.env` files or secret algorithms during live coding or streaming sessions. The design prioritizes security over usability.

## Installation

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "File Obscura"
4. Click Install

Or install via command line:
```bash
code --install-extension miyazakiyuma.file-obscura
```

## Features

- **Automatic file masking**: Files not in the allowlist are automatically masked when opened
- **Allowlist-based protection**: Only files explicitly allowed are shown normally
- **Temporary reveal**: Masked files can be revealed with a confirmation, then automatically re-masked after a timeout
- **Temporary mask toggle**: Toggle the masking feature on/off temporarily with one click from the status bar. The feature will automatically re-enable on next startup
- **Glob pattern support**: Flexible file matching using glob patterns
- **Workspace-scoped settings**: Configure per workspace for different projects

## Usage

1. **Configure the allowlist**: Add files or patterns to `fileObscura.allowlist` in settings
   - Example: `["*.js", "*.ts", ".env.local"]`
   
2. **Open files**: Files not in the allowlist will show a masked view instead of content

3. **Reveal files**: Click the "Show File" button when you need to see the content
   - The file will be revealed temporarily
   - After the timeout period (default: 5 minutes), the file will be automatically masked again if closed

4. **Add to allowlist**: Use the "Add to Allowlist" button in the masked view to permanently exclude a file from masking

5. **Temporarily disable masking**: Click the "🔒 On" button in the status bar (bottom right) to temporarily disable the masking feature
   - While disabled, all files can be opened normally
   - The button changes to "🔓 Off"
   - Click again to re-enable masking
   - When re-enabled, open files that should be masked will automatically switch to masked view
   - **Note**: This setting is temporary and will automatically revert to enabled when VS Code is restarted

### Example Use Cases

- **Live coding streams**: Protect `.env` files containing API keys
- **Screen sharing**: Prevent accidentally showing secret algorithms
- **Code reviews**: Mask sensitive configuration files

## Settings

### `fileObscura.enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable or disable the masking feature globally

### `fileObscura.allowlist`
- **Type**: `array` of `string`
- **Default**: `[]`
- **Scope**: Resource (workspace)
- **Description**: List of files or glob patterns to exclude from masking. Files matching these patterns will open normally. If empty, all files will be masked.
- **Examples**:
  - `["*.js", "*.ts"]` - Allow all JavaScript and TypeScript files
  - `["src/**/*", ".env.local"]` - Allow all files in `src/` directory and `.env.local` file
  - `["**/*.env"]` - Allow all `.env` files

### `fileObscura.revealTimeout`
- **Type**: `number`
- **Default**: `5`
- **Minimum**: `1`
- **Description**: Timeout in minutes for revealed files. Files are automatically removed from the revealed list after this time period if they are closed.

