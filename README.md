# dsh-chat-timeline

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-dwb--ajay%2Fdsh--chat--timeline-blue)](https://github.com/dwb-ajay/dsh-chat-timeline)

Fork of [jjxjjjjiik-bot/dsh-chat-timeline](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline) with **dsh-rewind** support.

DeepSeek-style right-side chat timeline for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). Shows a slim rail of your user messages; hover for previews, click to jump.

Not affiliated with DeepSeek.

## Install (recommended)

Install **from this GitHub fork** — not from npm. The original npm package is upstream and does **not** include the rewind fix.

If you already have the upstream plugin, remove it first (avoids two rails):

```bash
dsh plugin --profile web remove dsh-chat-timeline
```

Then install this fork:

```bash
dsh plugin --profile web add github:dwb-ajay/dsh-chat-timeline
```

Restart DSH web and hard-refresh the browser:

```bash
dsh web
```

You do **not** need to clone the repo yourself for normal use.  
`dsh plugin … add github:…` pulls and registers it for you.

### Optional: local path (dev)

If you already cloned this repo (e.g. for hacking on it):

```bash
dsh plugin --profile web add /path/to/dsh-chat-timeline
```

On this machine that might be:

```bash
dsh plugin --profile web add C:\Users\Hp\Desktop\dev\software\labs\dsh-chat-timeline
```

## What’s different in this fork

After **dsh-rewind** rolls the chat back, the timeline used to keep showing the withdrawn user messages.

This fork:

- drops those messages from the host timeline index when rewind cuts the surface
- filters the same hide range on the client rail

So the rail matches the visible chat after rewind.

## Features

- Right-side message rail (DeepSeek ScrollNav style)
- Hover previews + click-to-jump
- Light / dark theme
- Auto-hides with fewer than 2 user messages, or on narrow screens
- Works with **dsh-rewind** (this fork)

## Preview

<div align="center">
  <img src="assets/screenshot-1.png" alt="Right-side navigation rail" width="45%"/>
  <img src="assets/screenshot-2.png" alt="Hover-expanded panel" width="45%"/>
</div>

## npm?

**Not published to npm yet.**  
Install with the `github:dwb-ajay/dsh-chat-timeline` command above.

If we publish later, it will need a **new package name** (upstream already owns `dsh-chat-timeline` on npm).

## License

MIT — see [LICENSE](LICENSE).

Upstream: [jjxjjjjiik-bot/dsh-chat-timeline](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline).  
“DeepSeek” is a trademark of its owner.
