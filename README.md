# Tampermonkey Scripts

個人使用的 Tampermonkey userscript 集合，每支腳本一個資料夾。

## 腳本清單

| 腳本 | 說明 | 安裝 |
|------|------|------|
| [Tab Renamer](tab-renamer/) | 用 Tampermonkey 選單自訂任何網站的 tab 標題 | [安裝](https://raw.githubusercontent.com/akaihoshi/tampermonkey-scripts/master/tab-renamer/tab-renamer.user.js) |

## 安裝前準備（Chrome）

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/) 擴充功能。
2. 打開 `chrome://extensions` → Tampermonkey → Details → 開啟「Allow User Scripts」。
   - 較舊的 Chrome 沒有此選項，改開右上角的「Developer mode」。
3. 點上方表格的「安裝」連結，在 Tampermonkey 的安裝畫面按「Install」。

## Tab Renamer

### 使用方式

1. 進到想改名的網站頁面。
2. 點 Tampermonkey 圖示 → Tab Renamer → 「✏️ 設定目前頁面的名稱」。
3. 第一個輸入框是套用範圍（網域 + 路徑），此路徑底下的所有頁面都會生效。
4. 第二個輸入框是要顯示的名稱。

其他選單：

- 「🗑️ 移除目前頁面的規則」：移除目前頁面套用的規則，重新整理後恢復原標題。
- 「📋 查看 / 刪除所有規則」：列出所有規則，輸入編號刪除。

### 顯示規則

- 剛好在規則路徑上：只顯示名稱，例如 `MyProject`。
- 在規則路徑底下的頁面：`名稱/原標題`。
  - 原標題有 ` · ` 分段（如 GitLab）時只取第一段，例如 `MyProject/Pipelines`。
  - 沒有分段時接上整個原標題。
- 多條規則符合時，路徑最長（最精確）的那條生效。
- 規則存在 Tampermonkey 的腳本儲存空間，只在本機有效。刪除腳本時規則會一起刪除。

### 保護機制

- 沒有任何規則的網域，載入時只檢查一次，不會持續監聽。
- 若 10 秒內改 title 超過 20 次（代表跟網站互搶），會停止監聽並跳出提醒，重新整理頁面可恢復。
  - 可在腳本開頭調整 `MAX_WRITES` 與 `WINDOW_MS`。

## 開發與更新

- 每支腳本的 `@updateURL` / `@downloadURL` 指向 `master` 上的 raw 檔案。
- **改完一定要調高 `@version` 再 push**，否則 Tampermonkey 不會更新。
- Tampermonkey 預設約每天檢查更新，可在 Dashboard 手動觸發「Check for updates」。
- GitHub raw 有數分鐘快取，剛 push 時可能仍拿到舊版。
- 腳本路徑固定為 `<name>/<name>.user.js`，不要移動，否則已安裝的腳本會無法更新。
  - 若未來加入建置流程，原始碼放 `<name>/src/`，建置產物仍輸出到 `<name>/<name>.user.js`。
