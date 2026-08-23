# dsh-chat-timeline

English | [**简体中文**](README.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/dsh-chat-timeline.svg)](https://www.npmjs.com/package/dsh-chat-timeline)
[![GitHub stars](https://img.shields.io/github/stars/jjxjjjjiik-bot/dsh-chat-timeline?style=social)](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline/pulls)

> ⭐️ **If you find this plugin helpful, please consider giving it a free [Star](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline)!** Your support is the greatest motivation for continuous maintenance~

A **1:1 port and enhancement of the official DeepSeek web app's right-side conversation navigation rail (ScrollNav)** as a DeepSeek Harness (DSH) plugin — the exact ScrollNav UI/UX from `chat.deepseek.com`'s shipped client, brought to your DSH Web chat with key-point bookmarking and rewind integration.

> Not affiliated with, endorsed by, or sponsored by DeepSeek.

## Preview

<div align="center">
  <img src="assets/screenshot-1.png" alt="Right-side navigation rail" width="45%"/>
  <img src="assets/screenshot-2.png" alt="Hover-expanded panel" width="45%"/>
</div>

## Features

- **Always-visible right rail** — slim fixed vertical rail; every user-sent message appears as one indicator line, exactly matching the official collapsed state
- **⭐ Key-point Bookmarks & Filter** — star important message turns with `★`; marked items highlight with **golden indicator lines** in the collapsed rail; one-click "★ Marked only (n)" header filter; auto-persisted via `localStorage`
- **Full light & dark theme adaptivity** — 1:1 pixel-perfect port of DeepSeek official themes: crisp grey indicator lines and frosted white glass panel in light mode, immersive dark theme with high-contrast amber/gold indicators in dark mode
- **✨ Smooth Jump Stabilization** — click to jump smoothly to any message (loads older history on demand); smart scroll-freeze guard completely eliminates timeline panel jitter during long-distance jumps
- **🔄 Rewind Integration** — deeply integrated with `dsh-rewind`; withdrawn messages are automatically removed from the timeline projection and view
- **Dynamic workbench avoidance** — detects right-side workbenches or sidebars (e.g., aionui) and automatically shifts to align with the conversation scrollport
- **Auto-hidden & Narrow Viewport Guard** — disappears when the session has fewer than 2 user messages; automatically hides when viewport width ≤ 767px (mobile / narrow windows)
- **Accessible** — comprehensive ARIA labels + keyboard navigation (Enter/Space) + `prefers-reduced-motion` compliance

## How it works

The host half registers the `dshChatTimeline` session projection that durably enumerates all user-sent messages (supporting surface replace cuts for rewind); the client half renders the `TimelineRail` component (mounted in the `conversation.input.dock` slot, portal-rendered to body). Data sources, fastest first: projection → loaded chat nodes → background `loadOlder` loop.

## Install

### Method 1: DSH / NPM One-command install (Recommended)

Run in your terminal (installs directly from npm and registers configuration):

```bash
dsh plugin --profile web add dsh-chat-timeline
```

Or:

```bash
dsh plugin add dsh-chat-timeline
```

After installation, restart `dsh web` and refresh your browser.

---

### Method 2: One-click script (Windows)

1. Download this repo (green Code button → Download ZIP, or `git clone`)
2. Double-click **`install.bat`** — the script copies the plugin, registers the config, and runs `pnpm install` automatically
3. Restart `dsh web` and refresh the browser

> The script is idempotent: re-running it won't re-install.

---

### Method 3: Manual install (other platforms or local development)

1. Copy the plugin to `$DSH_HOME/profiles/web/plugins/dsh-chat-timeline/` (`$DSH_HOME` is usually `~/.dsh`)
2. Add `"dsh-chat-timeline": "file:plugins/dsh-chat-timeline"` to `profiles/web/package.json`, then run `pnpm install`
3. Add to `profiles/web/cordis.patch.yml`:
   ```yaml
   - insert:
       - id: chat-timeline
         name: dsh-chat-timeline
   ```
4. Restart `dsh web` and refresh the browser

## Architecture reference

- Layout/CSS: 1:1 port of the official ScrollNav (extracted from the shipped `main.css`), re-scoped under the `dsct_` prefix
- Plugin architecture: modeled on [asukasec/dsh-message-preview](https://github.com/asukasec/dsh-message-preview) (MIT)

## License

MIT — see [LICENSE](LICENSE). "DeepSeek" is a trademark of its owner; this project is not affiliated with DeepSeek.
