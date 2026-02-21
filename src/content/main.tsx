// Content script — injects CSS to hide ad DOM elements

const AD_SELECTORS = [
  // Generic ad containers
  '[id*="google_ads"]',
  '[id*="div-gpt-ad"]',
  '[class*="adsbygoogle"]',
  '[id*="AdSlot"]',
  '[class*="ad-slot"]',
  '[class*="ad-banner"]',
  '[class*="ad-container"]',
  '[class*="ad-wrapper"]',
  '[class*="ad-unit"]',
  '[class*="ad-block"]',
  '[class*="advert"]',
  '[class*="advertisement"]',
  '[id*="advert"]',
  '[id*="advertisement"]',
  "[data-ad-unit]",
  "[data-ad-slot]",
  // Taboola / Outbrain widgets
  '[id*="taboola"]',
  '[class*="taboola"]',
  '[id*="outbrain"]',
  '[class*="outbrain"]',
  // Sponsored content labels
  '[class*="sponsored"]',
  '[id*="sponsored"]',
  '[aria-label="Sponsored"]',
  // Banner/leaderboard sizes
  'iframe[width="728"]',
  'iframe[width="970"]',
  'iframe[width="300"]',
  // Common ad iframe src patterns
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="googlesyndication"]',
  'iframe[src*="adnxs.com"]',
  'iframe[src*="rubiconproject"]',
  // Interstitial overlays
  '[class*="interstitial"]',
  '[id*="interstitial"]',
  '[class*="popup-ad"]',
  '[class*="pop-up-ad"]',
  // Sticky bottom ads
  '[class*="sticky-ad"]',
  '[id*="sticky-ad"]',
  '[class*="fixed-ad"]',
];

let styleEl: HTMLStyleElement | null = null;
let enabled = true;

function injectStyles() {
  if (styleEl) return;
  styleEl = document.createElement("style");
  styleEl.id = "__ad-blocker-styles__";
  styleEl.textContent = `${AD_SELECTORS.join(",\n")} { display: none !important; visibility: hidden !important; }`;
  document.documentElement.appendChild(styleEl);
}

function removeStyles() {
  if (styleEl) {
    styleEl.remove();
    styleEl = null;
  }
}

// Read enabled state from storage before doing anything
chrome.storage.local.get(["enabled"], ({ enabled: storedEnabled }) => {
  enabled = storedEnabled !== false;
  if (enabled) injectStyles();
});

// Listen for toggle from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ENABLED_CHANGED") {
    enabled = message.enabled;
    if (enabled) {
      injectStyles();
    } else {
      removeStyles();
    }
  }
});
