// Background service worker — manages state, listens for blocked requests

chrome.runtime.onInstalled.addListener(async () => {
  // Initialize storage on first install
  const existing = await chrome.storage.local.get(["enabled", "totalBlocked", "sessionBlocked"]);
  if (existing.enabled === undefined) {
    await chrome.storage.local.set({
      enabled: true,
      totalBlocked: 0,
      sessionBlocked: 0,
      blockedByDomain: {},
    });
  } else {
    // Reset session count on reinstall/update
    await chrome.storage.local.set({ sessionBlocked: 0 });
  }
});

// Track blocked requests using declarativeNetRequest matched rules feedback
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(async (info) => {
  if (info.rule.rulesetId === "ad_rules") {
    const result = await chrome.storage.local.get([
      "totalBlocked",
      "sessionBlocked",
      "blockedByDomain",
    ]);
    const totalBlocked: number = (result.totalBlocked as number) ?? 0;
    const sessionBlocked: number = (result.sessionBlocked as number) ?? 0;
    const blockedByDomain: Record<string, number> =
      (result.blockedByDomain as Record<string, number>) ?? {};

    let domain = "";
    try {
      domain = new URL(info.request.url).hostname;
    } catch {
      domain = "unknown";
    }

    const updatedDomains = { ...blockedByDomain };
    updatedDomains[domain] = (updatedDomains[domain] ?? 0) + 1;

    await chrome.storage.local.set({
      totalBlocked: totalBlocked + 1,
      sessionBlocked: sessionBlocked + 1,
      blockedByDomain: updatedDomains,
    });
  }
});

// Listen for messages from popup/sidepanel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_STATS") {
    chrome.storage.local
      .get(["enabled", "totalBlocked", "sessionBlocked", "blockedByDomain"])
      .then(sendResponse);
    return true; // keep channel open for async response
  }

  if (message.type === "TOGGLE_ENABLED") {
    chrome.storage.local.get(["enabled"]).then(async ({ enabled }) => {
      const next = !enabled;
      await chrome.storage.local.set({ enabled: next });

      // Enable/disable the ruleset dynamically
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: next ? ["ad_rules"] : [],
        disableRulesetIds: next ? [] : ["ad_rules"],
      });

      sendResponse({ enabled: next });
    });
    return true;
  }

  if (message.type === "RESET_STATS") {
    chrome.storage.local
      .set({ totalBlocked: 0, sessionBlocked: 0, blockedByDomain: {} })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
});

// Notify content scripts when enabled state changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enabled) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "ENABLED_CHANGED",
              enabled: changes.enabled.newValue,
            })
            .catch(() => {
              // Tab may not have content script — ignore
            });
        }
      });
    });
  }
});
