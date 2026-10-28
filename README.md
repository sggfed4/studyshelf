# Cloudflare setup for VS Code / GitHub Copilot

This bundle targets the user's Windows 11 + VS Code workflow.

## Install
1. Extract this folder into `C:\Users\logan\StudyShelf3` so `.vscode\mcp.json` is inside the project.
2. Open PowerShell in `C:\Users\logan\StudyShelf3`.
3. Run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\setup-cloudflare.ps1
   ```
   This does not change your system execution policy. It backs up an existing `.vscode\mcp.json`, adds/updates only the Cloudflare MCP entry, then installs Cloudflare skills in the project.
4. In VS Code, run **Developer: Reload Window** from the Command Palette.
5. Use GitHub Copilot Chat in **Agent** mode. On first use of the Cloudflare MCP server, complete the Cloudflare OAuth flow in your browser.

The MCP endpoint is `https://mcp.cloudflare.com/mcp`. Review the OAuth permissions before approving them.

## Notes
- This config is for VS Code's `.vscode/mcp.json` format (`servers`, not `mcpServers`).
- It does not deploy or change your Cloudflare site, DNS, Workers, Pages, or D1 resources.
- Keep secrets such as `ADMIN_TOKEN` and `HASH_SALT` out of source control.
