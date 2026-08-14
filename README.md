# dsh-chat-timeline

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline/pulls)

A [DeepSeek Harness](https://github.com/deepseek-ai/dsh) (DSH) plugin that brings
the **official DeepSeek web app's right-side conversation scroll-navigation
rail** to your DSH Web chat — a **1:1 port** of the ScrollNav UI/UX extracted
from `chat.deepseek.com`'s shipped client.

> **Not affiliated with, endorsed by, or sponsored by DeepSeek.**
> This is an independent open-source project that recreates a public UI pattern.

## Features

- **Always-visible right rail** — a slim fixed vertical rail (right side, center
  height, blurred translucent backdrop); every user-sent message appears as one
  small indicator line, exactly like the official app's collapsed state.
- **Hover to expand** — hovering the rail reveals a panel (background layer +
  shadow + border) whose items fade their message text in; 240px wide for
  sessions with more than 8 user messages, otherwise width fits content.
- **Reading-position highlight** — the item nearest your current reading
  position is highlighted in the brand blue, tracking scroll in real time.
- **Click to jump** — clicking an item smoothly scrolls the chat to that
  message, loading older history on demand, and flashes the target row.
- **Auto-hidden** — the rail disappears when the session has fewer than 2 user
  messages.
- **Accessible** — `role="navigation"`, ARIA labels, `aria-current`, and
  `prefers-reduced-motion` support.

## How it works

```
User messages (session events)
        │
        ▼
Host plane: "dshChatTimeline" session projection
(durable enumeration of user turns: seq / time / preview / id)
        │
        ▼
Web client: TimelineRail component
(mounted in conversation.input.dock, portal-rendered to body)
        │
        ├─ fastest source first: projection → loaded chat nodes → background loadOlder loop
        ├─ reading-position tracking on the conversation scrollport
        └─ click → jumpToMessage() (loads older history if needed, smooth scroll, row flash)
```

The host half registers a session projection unit (`dshChatTimeline`) that
durably enumerates user-sent messages; the client half renders the rail and
reconstructs each chat node's `data-chat-anchor-key` for jumping. Compaction
deliberately keeps user messages in the transcript, so the timeline stays
complete across long sessions.

## Install (DSH web profile)

1. **Copy the plugin** into your profile directory, e.g.
   `$DSH_HOME/profiles/web/plugins/dsh-chat-timeline/`
   (`$DSH_HOME` is usually `~/.dsh`).

2. **Declare the dependency** in `$DSH_HOME/profiles/web/package.json`:
   ```json
   "dsh-chat-timeline": "file:plugins/dsh-chat-timeline"
   ```
   Then run `pnpm install`.

3. **Compose it into the profile** in `$DSH_HOME/profiles/web/cordis.patch.yml`:
   ```yaml
   - insert:
       - id: chat-timeline
         name: dsh-chat-timeline
   ```

4. **Restart `dsh web`** and hard-refresh the browser.

5. **Verify** — in any session with 2+ user messages, the right-side rail
   appears; hover to expand, click an item to jump.

## Architecture reference

- Layout/CSS: 1:1 port of the DeepSeek web app's ScrollNav (extracted from the
  shipped `main.css`), re-scoped under the `dsct_` prefix.
- Plugin architecture: modeled on [asukasec/dsh-message-preview](https://github.com/asukasec/dsh-message-preview)
  (MIT).

## Implementation notes (for plugin developers)

- Host half (`lib/index.js`): registers the `dshChatTimeline` session projection
  — only **direct user-sent** messages (`user/message` with `source.kind ===
  "user"`) shape the timeline; tool-injected context rows are excluded.
- Client half (`lib/client.js`): exports `{ name, inject, apply }` plus the
  `TimelineRail` component; injected into the `conversation.input.dock` slot,
  portal-rendered to `document.body`.
- Locale dictionaries (`zh` / `en`) are registered under the `chat-timeline`
  namespace.

## License

MIT — see [LICENSE](LICENSE).

**Trademark notice**: "DeepSeek" and the DeepSeek web app are trademarks of
their respective owners. This project is not affiliated with DeepSeek; the
recreated UI pattern is used for interoperability/parity purposes only.
