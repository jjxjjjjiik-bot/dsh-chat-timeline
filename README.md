# dsh-chat-timeline

[**English**](README.en.md) | 简体中文

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/dsh-chat-timeline.svg)](https://www.npmjs.com/package/dsh-chat-timeline)
[![GitHub stars](https://img.shields.io/github/stars/jjxjjjjiik-bot/dsh-chat-timeline?style=social)](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline/pulls)

> ⭐️ **如果这个小插件帮到了你，请给本项目点一个免费的 [Star](https://github.com/jjxjjjjiik-bot/dsh-chat-timeline) 支持一下！** 你的鼓励是持续优化更新的最大动力～

**1:1 复刻 DeepSeek 官网右侧「对话导航栏」**的 DeepSeek Harness (DSH) 插件——把 `chat.deepseek.com` 官方网页版的 ScrollNav 界面与交互原样带进你的 DSH Web 聊天界面，并支持重点书签与回退撤回联动。

> 非 DeepSeek 官方出品，与 DeepSeek 无任何关联。

## 预览

<div align="center">
  <img src="assets/screenshot-1.png" alt="右侧导航栏" width="45%"/>
  <img src="assets/screenshot-2.png" alt="悬停展开面板" width="45%"/>
</div>

## 功能特性

- **常驻右侧导航轨**——屏幕右侧细长竖轨，每条用户消息对应一个指示线，与官网折叠态 1:1 一致
- **⭐ 重点节点书签与筛选**——展开面板点击 `★` 即可加星标记；折叠态已标记项呈现**高亮金色指示线**；顶部「★ 只看标记 (n)」支持一键筛选重点问答；本地 `localStorage` 自动持久化
- **全模式主题适配**——1:1 像素级复刻 DeepSeek 官网浅色/深色主题：浅色模式下灰线清爽优雅、白底毛玻璃展开面板；深色模式沉浸暗黑、高对比度金色标记
- **✨ 丝滑跳转与防抖**——点击条目一键平滑跳转到对应消息（按需加载更早历史）；智能防抖锁定机制，彻底消除长对话跨区域跳转时悬浮面板的抽搐乱跳
- **🔄 回退撤回深度兼容**——与 `dsh-rewind` 插件联动，被回退或撤回的消息自动从时间线上剔除
- **动态避让**——智能检测右侧工作台（如 aionui 等工具栏），自动平移贴合聊天区边缘，避免重叠遮挡
- **自动隐藏与窄屏适配**——会话少于 2 条用户消息时自动隐藏；视口宽度 ≤ 767px（移动端/窄窗口）自动收起防遮挡
- **无障碍**——完善的 ARIA 标签与键盘导航 + 遵循系统「减弱动态效果（prefers-reduced-motion）」设置

## 工作原理

Host 侧通过会话投影（`dshChatTimeline`）持久化枚举所有用户消息（支持 surface replace 自动剔除回退消息）；客户端 `TimelineRail` 组件渲染导航轨（挂载于 `conversation.input.dock` 插槽，portal 到 body），数据源按速度优先：投影 → 已加载节点 → 后台 `loadOlder`。

## 安装

### 方式一：DSH / NPM 一键安装（推荐，最简便）

在终端中执行以下命令（自动从 npm 下载并配置）：

```bash
dsh plugin --profile web add dsh-chat-timeline
```

或者：

```bash
dsh plugin add dsh-chat-timeline
```

安装完成后，重启 `dsh web` 并刷新浏览器即可。

---

### 方式二：Windows 本地一键脚本（克隆/下载仓库）

1. 下载本项目（绿色 Code 按钮 → Download ZIP 解压，或 `git clone`）
2. 双击 **`install.bat`** —— 脚本自动完成：复制插件 → 注册配置 → `pnpm install`
3. 重启 `dsh web` 并刷新浏览器

> 脚本可重复运行，不会重复安装。

---

### 方式三：手动安装（其他平台或本地开发）

1. 将插件复制到 `$DSH_HOME/profiles/web/plugins/dsh-chat-timeline/`（`$DSH_HOME` 通常是 `~/.dsh`）
2. 在 `profiles/web/package.json` 添加依赖 `"dsh-chat-timeline": "file:plugins/dsh-chat-timeline"`，运行 `pnpm install`
3. 在 `profiles/web/cordis.patch.yml` 添加：
   ```yaml
   - insert:
       - id: chat-timeline
         name: dsh-chat-timeline
   ```
4. 重启 `dsh web` 并刷新浏览器

## 架构参考

- 布局/CSS：官网 ScrollNav 的 1:1 移植（提取自官方 `main.css`，以 `dsct_` 前缀命名空间化）
- 插件架构：参考 [asukasec/dsh-message-preview](https://github.com/asukasec/dsh-message-preview)（MIT）

## License

MIT — 见 [LICENSE](LICENSE)。"DeepSeek" 商标归其所有者所有，本项目与 DeepSeek 无关联。
