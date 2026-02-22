# Ad Blocker

A Chrome extension that blocks ads and trackers for a cleaner, faster browsing experience. Built with React, TypeScript, Vite, and CRXJS.

## Features

- **Network blocking** — 50 `declarativeNetRequest` rules block ad requests from Google Ads, DoubleClick, Taboola, Criteo, Facebook Pixel, Twitter Ads, and more before they load
- **DOM element hiding** — CSS injection hides ad containers that slip through network rules
- **Live statistics** — session and all-time block counts, broken down by domain
- **One-click pause** — toggle blocking on/off from the popup or side panel
- **Welcome page** — opens automatically on first install
- **Side panel** — detailed domain breakdown with bar chart, auto-refreshes every 3s

## Tech Stack

| Tool | Purpose |
|---|---|
| React 19 + TypeScript | Popup, side panel, welcome page UI |
| Vite 7 + CRXJS | Build tooling and Chrome extension bundling |
| oxlint | Fast Rust-based linting |
| oxfmt | Formatting |
| Husky | Pre-commit hooks (runs `fmt:check`, `lint`, and `test`) |
| bun:test | Built-in Bun test runner |
| happy-dom | DOM environment for unit tests |
| GitHub Actions | CI on PRs; automated release on version tags |

## Project Structure

```
src/
├── background/          # Service worker — state management, install handler, message API
├── content/
│   ├── main.tsx         # Ad CSS injection (runs on all sites)
│   └── kun-injector.ts  # "Click me" button injector (kun.uz only)
├── popup/               # Extension toolbar popup
├── sidepanel/           # Chrome side panel UI
├── welcome/             # Welcome page (shown on first install, also options page)
├── assets/
└── tests/               # Bun unit tests for background, content, and kun-injector
rules/
└── ad_rules.json        # declarativeNetRequest blocking rules (50 rules)
.github/
└── workflows/
    ├── ci.yml           # CI — format, lint, type-check, test, build
    └── release.yml      # Release — build + attach zip to GitHub Release
manifest.config.ts       # Chrome extension manifest v3
```

## Getting Started

Install dependencies:

```bash
bun install
```

Build for production:

```bash
bun run build
```

Load in Chrome:

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

The welcome page opens automatically on first install. To view it again, go to `chrome://extensions/` and click **Details → Extension options**.

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start Vite dev server |
| `bun run build` | Type-check and build to `dist/` |
| `bun run lint` | Run oxlint on `src/` |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run fmt` | Format `src/` with oxfmt |
| `bun run fmt:check` | Check formatting without writing (used by pre-commit hook) |
| `bun run test` | Run all unit tests with bun:test |

## Testing

Unit tests live in `src/tests/` and run with Bun's built-in test runner (no Vitest or Jest needed).

```bash
bun run test
```

| Test file | What it covers |
|---|---|
| `background.test.ts` | Install handler, storage init, GET_STATS, TOGGLE_ENABLED, RESET_STATS |
| `content.test.ts` | CSS injection, style removal, idempotency, ENABLED_CHANGED message |
| `kun-injector.test.ts` | Button injection, sibling placement, double-injection guard, MutationObserver |

Tests use a manual `chrome` API mock — no browser required. The pre-commit hook runs all tests before every commit.

## CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| **CI** | Pull request or push to `main` | fmt:check → lint → type-check → test → build |
| **Release** | Push a `v*.*.*` tag | test → build → create GitHub Release with extension zip |

To release a new version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Tags containing a hyphen (e.g. `v1.0.0-beta`) are automatically marked as pre-releases.

## Permissions

| Permission | Reason |
|---|---|
| `declarativeNetRequest` | Network-level ad blocking |
| `declarativeNetRequestFeedback` | Track which rules matched (dev builds only) |
| `storage` | Persist enabled state and block counts |
| `tabs` | Open welcome page on install |
| `activeTab` | Extension action context |
| `sidePanel` | Side panel UI |
| `host_permissions: <all_urls>` | Block ads on all sites |
