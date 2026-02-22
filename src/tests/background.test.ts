import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
// spyOn is used for declarativeNetRequest tests below

// ── Minimal Chrome mock (no happy-dom needed for pure logic tests) ──────────

const store: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    local: {
      get: async (keys: string[]) => {
        const r: Record<string, unknown> = {};
        for (const k of keys) r[k] = store[k];
        return r;
      },
      set: async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      },
    },
    onChanged: { addListener: mock() },
  },
  runtime: {
    onInstalled: { addListener: mock() },
    onMessage: { addListener: mock() },
    getURL: (path: string) => `chrome-extension://abc/${path}`,
    OnInstalledReason: { INSTALL: "install", UPDATE: "update" },
  },
  tabs: { create: mock(), query: mock(), sendMessage: mock() },
  declarativeNetRequest: {
    onRuleMatchedDebug: { addListener: mock() },
    updateEnabledRulesets: mock(async () => {}),
  },
};

(globalThis as unknown as Record<string, unknown>).chrome = chromeMock;

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("background: onInstalled — first install", () => {
  it("initialises storage with defaults", async () => {
    // Simulate first install (storage empty)
    const handler = async (details: { reason: string }) => {
      const existing = await chrome.storage.local.get([
        "enabled",
        "totalBlocked",
        "sessionBlocked",
      ]);
      if (existing.enabled === undefined) {
        await chrome.storage.local.set({
          enabled: true,
          totalBlocked: 0,
          sessionBlocked: 0,
          blockedByDomain: {},
        });
      }
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: chrome.runtime.getURL("src/welcome/index.html") });
      }
    };

    await handler({ reason: "install" });

    expect(store.enabled).toBe(true);
    expect(store.totalBlocked).toBe(0);
    expect(store.sessionBlocked).toBe(0);
    expect(store.blockedByDomain).toEqual({});
  });

  it("opens welcome tab on first install", async () => {
    const calls: unknown[][] = [];
    chromeMock.tabs.create = mock((...args: unknown[]) => {
      calls.push(args);
    });

    const handler = async (details: { reason: string }) => {
      const existing = await chrome.storage.local.get(["enabled"]);
      if (existing.enabled === undefined) {
        await chrome.storage.local.set({
          enabled: true,
          totalBlocked: 0,
          sessionBlocked: 0,
          blockedByDomain: {},
        });
      }
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: chrome.runtime.getURL("src/welcome/index.html") });
      }
    };

    await handler({ reason: "install" });
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toEqual({ url: "chrome-extension://abc/src/welcome/index.html" });
  });

  it("does NOT open welcome tab on update", async () => {
    const calls: unknown[][] = [];
    chromeMock.tabs.create = mock((...args: unknown[]) => {
      calls.push(args);
    });
    store.enabled = true;

    const handler = async (details: { reason: string }) => {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: chrome.runtime.getURL("src/welcome/index.html") });
      }
    };

    await handler({ reason: "update" });
    expect(calls.length).toBe(0);
  });

  it("resets sessionBlocked on update", async () => {
    store.enabled = true;
    store.sessionBlocked = 42;

    const handler = async (details: { reason: string }) => {
      const existing = await chrome.storage.local.get(["enabled"]);
      if (existing.enabled !== undefined) {
        await chrome.storage.local.set({ sessionBlocked: 0 });
      }
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: "" });
      }
    };

    await handler({ reason: "update" });
    expect(store.sessionBlocked).toBe(0);
  });
});

describe("background: message handler — GET_STATS", () => {
  it("returns current storage values", async () => {
    store.enabled = true;
    store.totalBlocked = 10;
    store.sessionBlocked = 3;
    store.blockedByDomain = { "ads.example.com": 5 };

    const sendResponse = mock();
    const handler = (message: { type: string }, _sender: unknown, respond: typeof sendResponse) => {
      if (message.type === "GET_STATS") {
        chrome.storage.local
          .get(["enabled", "totalBlocked", "sessionBlocked", "blockedByDomain"])
          .then(respond);
        return true;
      }
    };

    handler({ type: "GET_STATS" }, null, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect((sendResponse as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0]).toEqual({
      enabled: true,
      totalBlocked: 10,
      sessionBlocked: 3,
      blockedByDomain: { "ads.example.com": 5 },
    });
  });
});

describe("background: message handler — TOGGLE_ENABLED", () => {
  it("toggles enabled from true to false", async () => {
    store.enabled = true;
    const updateRulesets = spyOn(chromeMock.declarativeNetRequest, "updateEnabledRulesets");

    const sendResponse = mock();
    const handler = (message: { type: string }, _sender: unknown, respond: typeof sendResponse) => {
      if (message.type === "TOGGLE_ENABLED") {
        chrome.storage.local.get(["enabled"]).then(async (result) => {
          const enabled = result.enabled as boolean;
          const next = !enabled;
          await chrome.storage.local.set({ enabled: next });
          await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: next ? ["ad_rules"] : [],
            disableRulesetIds: next ? [] : ["ad_rules"],
          });
          respond({ enabled: next });
        });
        return true;
      }
    };

    handler({ type: "TOGGLE_ENABLED" }, null, sendResponse);
    await new Promise((r) => setTimeout(r, 10));

    expect(store.enabled).toBe(false);
    expect(updateRulesets).toHaveBeenCalledWith({
      enableRulesetIds: [],
      disableRulesetIds: ["ad_rules"],
    });
  });

  it("toggles enabled from false to true", async () => {
    store.enabled = false;
    const sendResponse = mock();

    const handler = (message: { type: string }, _sender: unknown, respond: typeof sendResponse) => {
      if (message.type === "TOGGLE_ENABLED") {
        chrome.storage.local.get(["enabled"]).then(async (result) => {
          const enabled = result.enabled as boolean;
          const next = !enabled;
          await chrome.storage.local.set({ enabled: next });
          await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: next ? ["ad_rules"] : [],
            disableRulesetIds: next ? [] : ["ad_rules"],
          });
          respond({ enabled: next });
        });
        return true;
      }
    };

    handler({ type: "TOGGLE_ENABLED" }, null, sendResponse);
    await new Promise((r) => setTimeout(r, 10));

    expect(store.enabled).toBe(true);
  });
});

describe("background: message handler — RESET_STATS", () => {
  it("resets all counters to zero", async () => {
    store.totalBlocked = 99;
    store.sessionBlocked = 20;
    store.blockedByDomain = { "evil.com": 99 };

    const sendResponse = mock();
    const handler = (message: { type: string }, _sender: unknown, respond: typeof sendResponse) => {
      if (message.type === "RESET_STATS") {
        chrome.storage.local
          .set({ totalBlocked: 0, sessionBlocked: 0, blockedByDomain: {} })
          .then(() => respond({ ok: true }));
        return true;
      }
    };

    handler({ type: "RESET_STATS" }, null, sendResponse);
    await new Promise((r) => setTimeout(r, 10));

    expect(store.totalBlocked).toBe(0);
    expect(store.sessionBlocked).toBe(0);
    expect(store.blockedByDomain).toEqual({});
  });
});
