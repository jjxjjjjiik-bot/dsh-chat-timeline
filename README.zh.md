# dsh-chat-timeline

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline/pulls)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/dsh)（DSH）插件：把**官方 DeepSeek 网页版右侧的「对话滚动导航栏」**带进你的 DSH Web 聊天界面——从 `chat.deepseek.com` 官方客户端中提取的 ScrollNav 界面与交互的 **1:1 复刻**。

> **本项目与 DeepSeek 无任何关联，非官方出品，未经其认可或赞助。**
> 这是独立开源项目，仅复刻了一个公开的界面交互模式。

## 功能特性

- **常驻右侧导航轨** —— 屏幕右侧一条纤细的固定竖轨（垂直居中，毛玻璃半透明背景）；每条你发出的消息显示为一个小指示线，与官方 App 折叠态完全一致。
- **悬停展开面板** —— 鼠标悬停后展开面板（背景层 + 阴影 + 边框），消息项的文字渐显（透明度 0→1）；会话超过 8 条用户消息时面板宽 240px，否则宽度自适应内容。
- **阅读位置高亮** —— 距离当前阅读位置最近的消息项以品牌蓝高亮，随滚动实时更新。
- **点击跳转** —— 点击任意消息项，聊天窗口平滑滚动到对应消息（按需加载更早历史），并闪烁目标行。
- **自动隐藏** —— 会话少于 2 条用户消息时自动隐藏。
- **无障碍支持** —— `role="navigation"`、ARIA 标签、`aria-current`，并遵循系统「减弱动态效果」设置。

## 工作原理

```
用户消息（会话事件）
        │
        ▼
Host 侧："dshChatTimeline" 会话投影
（用户消息的持久化枚举：seq / time / 预览 / id）
        │
        ▼
Web 客户端：TimelineRail 组件
（挂载于 conversation.input.dock 插槽，portal 渲染到 body）
        │
        ├─ 数据源按速度优先：投影 → 已加载聊天节点 → 后台 loadOlder 加载
        ├─ 在会话滚动容器上跟踪阅读位置
        └─ 点击 → jumpToMessage()（必要时加载更早历史、平滑滚动、闪烁目标行）
```

Host 侧注册一个会话投影单元（`dshChatTimeline`），持久化枚举用户发出的消息；客户端渲染导航轨，并重建各聊天节点的 `data-chat-anchor-key` 用于跳转。压缩（compaction）刻意保留用户消息，因此长会话中时间线保持完整。

## 安装（DSH web 配置）

1. **将插件复制到你的配置目录**，例如：
   `$DSH_HOME/profiles/web/plugins/dsh-chat-timeline/`
   （`$DSH_HOME` 通常是 `~/.dsh`）。

2. **在 `$DSH_HOME/profiles/web/package.json` 声明依赖**：
   ```json
   "dsh-chat-timeline": "file:plugins/dsh-chat-timeline"
   ```
   然后运行 `pnpm install`。

3. **在 `$DSH_HOME/profiles/web/cordis.patch.yml` 中组合进配置**：
   ```yaml
   - insert:
       - id: chat-timeline
         name: dsh-chat-timeline
   ```

4. **重启 `dsh web`** 并强制刷新浏览器。

5. **验证** —— 任意有 2 条以上用户消息的会话中，右侧出现导航轨；悬停展开，点击消息项即可跳转。

## 架构参考

- 布局/CSS：DeepSeek 网页版 ScrollNav 的 1:1 移植（提取自其官方 `main.css`），重新以 `dsct_` 前缀命名空间化。
- 插件架构：参考 [asukasec/dsh-message-preview](https://github.com/asukasec/dsh-message-preview)（MIT）。

## 实现说明（面向插件开发者）

- Host 侧（`lib/index.js`）：注册 `dshChatTimeline` 会话投影——只有**用户直接发送**的消息（`user/message` 且 `source.kind === "user"`）进入时间线；工具注入的上下文行被排除。
- 客户端（`lib/client.js`）：导出 `{ name, inject, apply }` 及 `TimelineRail` 组件；注入 `conversation.input.dock` 插槽，portal 渲染到 `document.body`。
- 中英文语言包（`zh` / `en`）注册在 `chat-timeline` 命名空间下。

## 开源协议

MIT —— 见 [LICENSE](LICENSE)。

**商标声明**："DeepSeek" 及 DeepSeek 网页应用均为其各自所有者的商标。本项目与 DeepSeek 无关联；复刻的界面模式仅用于互操作/一致性目的。
