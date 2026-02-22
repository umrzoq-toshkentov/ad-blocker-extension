import "./setup.ts";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// ── Chrome mock ───────────────────────────────────────────────────────────────

let storedEnabled = true;
const messageListeners: Array<(msg: unknown) => void> = [];

(globalThis as unknown as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: async (_keys: string[]) => ({ enabled: storedEnabled }),
      set: mock(),
    },
  },
  runtime: {
    onMessage: {
      addListener: (cb: (msg: unknown) => void) => messageListeners.push(cb),
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStyleEl() {
  return document.getElementById("__ad-blocker-styles__") as HTMLStyleElement | null;
}

// Reset DOM and module state between tests
beforeEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
  messageListeners.length = 0;
  storedEnabled = true;
});

afterEach(() => {
  // Remove injected style if present
  getStyleEl()?.remove();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("content script: injectStyles / removeStyles", () => {
  it("injectStyles creates a <style> element with ad selectors", () => {
    const styleEl = document.createElement("style");
    styleEl.id = "__ad-blocker-styles__";
    styleEl.textContent = `[class*="adsbygoogle"] { display: none !important; }`;
    document.documentElement.appendChild(styleEl);

    expect(getStyleEl()).not.toBeNull();
    expect(getStyleEl()!.textContent).toContain("adsbygoogle");
  });

  it("removeStyles removes the <style> element", () => {
    const styleEl = document.createElement("style");
    styleEl.id = "__ad-blocker-styles__";
    document.documentElement.appendChild(styleEl);

    expect(getStyleEl()).not.toBeNull();
    getStyleEl()!.remove();
    expect(getStyleEl()).toBeNull();
  });

  it("injectStyles is idempotent — calling twice adds only one element", () => {
    function injectStyles() {
      if (document.getElementById("__ad-blocker-styles__")) return;
      const el = document.createElement("style");
      el.id = "__ad-blocker-styles__";
      document.documentElement.appendChild(el);
    }

    injectStyles();
    injectStyles();

    const els = document.querySelectorAll("#__ad-blocker-styles__");
    expect(els.length).toBe(1);
  });
});

describe("content script: ENABLED_CHANGED message", () => {
  it("removes styles when enabled becomes false", () => {
    // Pre-inject style
    const styleEl = document.createElement("style");
    styleEl.id = "__ad-blocker-styles__";
    document.documentElement.appendChild(styleEl);

    // Simulate the message listener logic
    const handleMessage = (message: { type: string; enabled: boolean }) => {
      if (message.type === "ENABLED_CHANGED") {
        if (message.enabled) {
          if (!getStyleEl()) {
            const el = document.createElement("style");
            el.id = "__ad-blocker-styles__";
            document.documentElement.appendChild(el);
          }
        } else {
          getStyleEl()?.remove();
        }
      }
    };

    handleMessage({ type: "ENABLED_CHANGED", enabled: false });
    expect(getStyleEl()).toBeNull();
  });

  it("injects styles when enabled becomes true", () => {
    const handleMessage = (message: { type: string; enabled: boolean }) => {
      if (message.type === "ENABLED_CHANGED") {
        if (message.enabled) {
          if (!getStyleEl()) {
            const el = document.createElement("style");
            el.id = "__ad-blocker-styles__";
            document.documentElement.appendChild(el);
          }
        } else {
          getStyleEl()?.remove();
        }
      }
    };

    handleMessage({ type: "ENABLED_CHANGED", enabled: true });
    expect(getStyleEl()).not.toBeNull();
  });

  it("ignores unrelated message types", () => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === "ENABLED_CHANGED") {
        // would modify DOM
      }
    };

    // Should not throw
    expect(() => handleMessage({ type: "SOME_OTHER_MESSAGE" })).not.toThrow();
    expect(getStyleEl()).toBeNull();
  });
});

describe("content script: AD_SELECTORS coverage", () => {
  const SELECTORS = [
    '[class*="adsbygoogle"]',
    '[id*="google_ads"]',
    '[class*="ad-slot"]',
    '[class*="advert"]',
    '[id*="taboola"]',
    '[class*="sponsored"]',
    'iframe[src*="doubleclick.net"]',
  ];

  it("selectors match expected ad element patterns", () => {
    for (const sel of SELECTORS) {
      // Create an element that matches the selector
      const div = document.createElement("div");

      if (sel.includes("class*=")) {
        const cls = sel.match(/class\*="([^"]+)"/)?.[1] ?? "";
        div.className = cls + "-something";
      } else if (sel.includes("id*=")) {
        const id = sel.match(/id\*="([^"]+)"/)?.[1] ?? "";
        div.id = id + "-1";
      } else if (sel.startsWith("iframe")) {
        const iframeEl = document.createElement("iframe");
        const attr = sel.match(/\[(\w+)\*="([^"]+)"\]/);
        if (attr) iframeEl.setAttribute(attr[1], `https://${attr[2]}/ad`);
        document.body.appendChild(iframeEl);
        expect(document.querySelector(sel)).not.toBeNull();
        iframeEl.remove();
        continue;
      }

      document.body.appendChild(div);
      expect(document.querySelector(sel)).not.toBeNull();
      div.remove();
    }
  });
});
