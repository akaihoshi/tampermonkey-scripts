# CLAUDE.md

個人 Tampermonkey userscript 集合。用法與更新說明見 README.md。

## 必守規則

- **改腳本一定要調高 `@version`**，否則 Tampermonkey 不會自動更新。
- **腳本路徑固定為 `<name>/<name>.user.js`，不可搬移或改名**：`@updateURL` / `@downloadURL` 指向這個路徑，搬了已安裝的腳本會無聲停止更新。
  - 若加入建置流程，原始碼放 `<name>/src/`，產物仍輸出到 `<name>/<name>.user.js`。
- **push 前先問使用者**。

## 新增腳本

1. 建資料夾 `<name>/`，腳本為 `<name>/<name>.user.js`。
2. 檔頭至少包含：`@name`、`@namespace <name>`、`@version`、`@description`、`@updateURL` 與 `@downloadURL`（皆為 `https://raw.githubusercontent.com/akaihoshi/tampermonkey-scripts/master/<name>/<name>.user.js`）、`@match`、需要的 `@grant`。
3. 在 README.md 的腳本清單加一列（含安裝連結），並補該腳本的使用說明章節。

## 驗證

- 語法：`node --check <name>/<name>.user.js`。
- 邏輯：必要時在 scratchpad 用 Node stub `location` / `document` / `GM_*` 模擬，模擬檔不 commit。
- 最終需使用者在瀏覽器實測，回報時明確說明哪些只做過模擬。
