import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Ad Blocker',
  description: 'Block ads and trackers for a cleaner, faster browsing experience.',
  version: pkg.version,
  icons: {
    16: 'public/logo.png',
    48: 'public/logo.png',
    128: 'public/logo.png',
  },
  action: {
    default_icon: {
      16: 'public/logo.png',
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
    default_title: 'Ad Blocker',
  },
  permissions: [
    'sidePanel',
    'storage',
    'declarativeNetRequest',
    'declarativeNetRequestFeedback',
    'tabs',
    'activeTab',
  ],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['https://*/*', 'http://*/*'],
      run_at: 'document_start',
    },
  ],
  declarative_net_request: {
    rule_resources: [
      {
        id: 'ad_rules',
        enabled: true,
        path: 'rules/ad_rules.json',
      },
    ],
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
