// ==UserScript==
// @name         Tab Renamer
// @namespace    tab-renamer
// @version      4.1
// @description  用 Tampermonkey 選單自訂任何網站的 tab 標題
// @updateURL    https://raw.githubusercontent.com/akaihoshi/tampermonkey-scripts/master/tab-renamer.user.js
// @downloadURL  https://raw.githubusercontent.com/akaihoshi/tampermonkey-scripts/master/tab-renamer.user.js
// @match        *://*/*
// @noframes
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'rules'; // 格式：[{ prefix: 'example.com/my-group/my-project', title: 'MyProject' }]
  const TITLE_SEPARATOR = ' · '; // GitLab 等網站的標題分段符號
  const MAX_WRITES = 20; // WINDOW_MS 內最多改幾次 title，超過視為跟網站互搶，停止監聽
  const WINDOW_MS = 10000;

  const loadRules = () => GM_getValue(STORAGE_KEY, []);
  const saveRules = (rules) => GM_setValue(STORAGE_KEY, rules);

  // 規則 key = 網域 + 路徑，去掉頭尾斜線，例如 example.com/my-group/my-project
  const normalizeKey = (s) => s.trim().replace(/^\/+|\/+$/g, '');
  const currentKey = () => normalizeKey(location.host + location.pathname);

  // GitLab 網址有 "/-/" 時取之前的部分（專案路徑），其他網站取完整路徑
  const suggestedKey = () => normalizeKey(location.host + location.pathname.split('/-/')[0]);

  const isUnder = (key, prefix) => key === prefix || key.startsWith(prefix + '/');

  // 多條符合時，取 prefix 最長（最精確）的那條
  const findRule = (rules, key) =>
    rules
      .filter((r) => isUnder(key, r.prefix))
      .sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null;

  const hasRulesForHost = () => loadRules().some((r) => isUnder(r.prefix, location.host));

  let observer = null;
  let stopped = false;
  let writeTimes = [];
  let lastSetTitle = null;
  let originalTitle = '';

  // 剛好在規則路徑上只顯示名稱；底下的頁面加上原標題
  // 原標題有分段符號取第一段（GitLab：「Pipelines · group / project · GitLab」→ Pipelines），沒有就整個接上
  const buildTitle = (rule) => {
    if (currentKey() === rule.prefix || !originalTitle) {
      return rule.title;
    }
    const page = originalTitle.split(TITLE_SEPARATOR)[0].trim();
    return page ? `${rule.title}/${page}` : rule.title;
  };

  const stopObserving = () => {
    stopped = true;
    observer?.disconnect();
    const message = `[Tab Renamer] ${location.host} 在 ${WINDOW_MS / 1000} 秒內改 title 超過 ${MAX_WRITES} 次，已停止監聽。重新整理頁面可恢復。`;
    console.warn(message);
    alert(message);
  };

  // 回傳 false 代表改太頻繁，已停止
  const recordWrite = () => {
    const now = Date.now();
    writeTimes = [...writeTimes.filter((t) => now - t < WINDOW_MS), now];
    if (writeTimes.length > MAX_WRITES) {
      stopObserving();
      return false;
    }
    return true;
  };

  const applyTitle = () => {
    if (stopped) {
      return;
    }
    // title 不是腳本設的 → 是網站換頁後設的原標題，記下來
    if (document.title !== lastSetTitle) {
      originalTitle = document.title;
    }
    const rule = findRule(loadRules(), currentKey());
    if (!rule) {
      return;
    }
    const title = buildTitle(rule);
    if (document.title !== title && recordWrite()) {
      lastSetTitle = title;
      document.title = title;
    }
  };

  // 只在有規則的網域開監聽器
  const ensureObserving = () => {
    if (observer || !document.head) {
      return;
    }
    observer = new MutationObserver(applyTitle);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
  };

  // ===== 選單 =====
  const addOrUpdateRule = () => {
    const prefixInput = prompt('套用的網域 + 路徑（此路徑底下所有頁面都會生效）：', suggestedKey());
    if (prefixInput === null || !prefixInput.trim()) {
      return;
    }
    const prefix = normalizeKey(prefixInput);
    const existing = loadRules().find((r) => r.prefix === prefix);
    const titleInput = prompt(`「${prefix}」要顯示的 tab 名稱：`, existing?.title ?? '');
    if (titleInput === null || !titleInput.trim()) {
      return;
    }
    const others = loadRules().filter((r) => r.prefix !== prefix);
    saveRules([...others, { prefix, title: titleInput.trim() }]);
    ensureObserving();
    applyTitle();
  };

  const removeRule = () => {
    const rules = loadRules();
    const rule = findRule(rules, currentKey());
    if (!rule) {
      alert('目前頁面沒有套用任何規則。');
      return;
    }
    if (confirm(`移除規則？\n${rule.prefix} → ${rule.title}\n\n（重新整理後恢復原標題）`)) {
      saveRules(rules.filter((r) => r.prefix !== rule.prefix));
    }
  };

  const manageRules = () => {
    const rules = loadRules();
    if (rules.length === 0) {
      alert('目前沒有任何規則。');
      return;
    }
    const list = rules.map((r, i) => `${i + 1}. ${r.prefix} → ${r.title}`).join('\n');
    const input = prompt(`${list}\n\n輸入編號可刪除該規則，取消則不變動：`);
    if (input === null) {
      return;
    }
    const index = Number(input) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= rules.length) {
      alert(`無效的編號：${input}`);
      return;
    }
    saveRules(rules.filter((_, i) => i !== index));
  };

  GM_registerMenuCommand('✏️ 設定目前頁面的名稱', addOrUpdateRule);
  GM_registerMenuCommand('🗑️ 移除目前頁面的規則', removeRule);
  GM_registerMenuCommand('📋 查看 / 刪除所有規則', manageRules);

  // ===== 啟動：沒有規則的網域只檢查這一次 =====
  const start = () => {
    if (!hasRulesForHost()) {
      return;
    }
    ensureObserving();
    applyTitle();
  };

  if (document.head) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start);
  }
})();
