/**
 * dsh-chat-timeline — web client half（Web 客户端侧）。
 *
 * 【中文】官方 DeepSeek 网页应用 ScrollNav（对话滚动导航栏）的 1:1 移植，
 * 提取自 chat.deepseek.com 官方发布的 main.js / main.css：
 *
 * (EN) A 1:1 port of the DeepSeek official web app's ScrollNav (conversation
 * scroll-navigation rail), extracted from chat.deepseek.com's shipped
 * main.js / main.css:
 *
 * 【中文】- 折叠态：固定在右缘 12px 处、垂直居中、34×300px 的细竖轨，
 *   带模糊半透明背景；每条用户消息显示为一条 8×2px 灰色指示线。
 * (EN) - collapsed: a fixed 34×300px vertical rail at right:16px, vertically
 *   centered, with a blurred translucent backdrop; every user message shows
 *   as one 8×2px grey indicator line
 *
 * 【中文】- 悬停展开面板（背景层 + 阴影 + 边框），消息项文字渐显
 *   （透明度 0→1）；会话超过 8 条用户消息时面板宽 240px，否则宽度自适应。
 * (EN) - hovering the rail expands a panel (bg layer + shadow + border) whose
 *   items reveal their message text (opacity 0→1); panel is 240px wide when
 *   the session has more than 8 user messages, otherwise width fits content
 *
 * 【中文】- 距离阅读位置最近的消息项高亮（品牌蓝文字）。
 * (EN) - the item nearest the reading position is highlighted (brand-blue text)
 *
 * 【中文】- 点击消息项，聊天窗口跳转到该消息（按需加载更早历史）并闪烁目标行。
 * (EN) - clicking an item jumps the chat to that message (loads older history on
 *   demand) and flashes the target row
 *
 * 【中文】- 会话少于 2 条用户消息时自动隐藏。
 * (EN) - auto-hidden when the session has fewer than 2 user messages
 *
 * 【中文】数据源按速度优先：主机消息索引投影 → 已加载聊天节点 → 后台
 * loadOlder 循环（更快的来源一旦送达即停止）。挂载于
 * conversation.input.dock 插槽，portal 渲染到 body。
 *
 * (EN) Data sources, fastest first: host messageIndex projection -> loaded chat
 * nodes -> background loadOlder loop (stopped as soon as a faster source
 * delivers). Mounted in conversation.input.dock, portal-rendered to body.
 *
 * 架构参考 (Architecture reference): asukasec/dsh-message-preview (MIT)。
 */
window.__ModuleLoader__.load({
  id: "dsh-chat-timeline",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react_jsx_runtime = require("react/jsx-runtime");
    let react = require("react");
    let react_dom = require("react-dom");

    //#region dsh-chat-timeline styles（样式：DeepSeek 网页版 ScrollNav 的 1:1 移植 / 1:1 port of DeepSeek web ScrollNav）
    const css =
      ".dsct_nav{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:100;display:flex;position:fixed;top:50%;right:12px;transform:translateY(-50%);align-items:center;justify-content:flex-end;pointer-events:auto}" +
      ".dsct_wrap{position:relative;z-index:2;border-radius:14px;width:24px;max-width:240px;transition:width .22s cubic-bezier(0.4,0,0.2,1),background-color .2s ease,box-shadow .2s ease,border-color .2s ease;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;border:1px solid transparent;background:transparent}" +
      ".dsct_wrap.dsct_show{width:240px;background:rgba(28,28,32,.95);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25)}" +
      ".dsct_page{max-height:340px;padding:12px 0;box-sizing:border-box;overscroll-behavior:contain;display:flex;flex-direction:column;align-items:stretch;width:100%;overflow:hidden}" +
      ".dsct_wrap.dsct_show .dsct_page{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.25) transparent}" +
      ".dsct_page::-webkit-scrollbar{width:4px}" +
      ".dsct_page::-webkit-scrollbar-track{background:transparent}" +
      ".dsct_page::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:4px}" +
      ".dsct_page::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.45)}" +
      ".dsct_item{flex-shrink:0;cursor:pointer;height:28px;min-height:28px;width:100%;padding:0 2px 0 12px;box-sizing:border-box;display:flex;align-items:center;justify-content:flex-end;background:none;border:none;font:inherit;text-align:right;transition:color .15s ease;color:rgba(255,255,255,.65)}" +
      ".dsct_item:hover{color:rgba(255,255,255,.95)}" +
      ".dsct_item.dsct_active{color:var(--dsw-alias-state-business-primary,#4d6bfe)}" +
      ".dsct_title{font-size:13px;line-height:20px;text-overflow:ellipsis;white-space:nowrap;opacity:0;margin-right:8px;flex:1;min-width:0;text-align:right;overflow:hidden;transition:opacity .15s ease,color .15s ease;color:inherit}" +
      ".dsct_title.dsct_show{opacity:1}" +
      ".dsct_item.dsct_active .dsct_title{color:var(--dsw-alias-state-business-primary,#4d6bfe);font-weight:500}" +
      ".dsct_ind{flex-shrink:0;width:20px;height:20px;display:flex;justify-content:center;align-items:center}" +
      ".dsct_line{background-color:rgba(255,255,255,.25);border-radius:2px;flex-shrink:0;width:8px;height:2px;transition:background-color .2s ease,width .2s ease,height .2s ease,transform .2s ease}" +
      ".dsct_item:hover .dsct_line{background-color:rgba(255,255,255,.75)}" +
      ".dsct_item.dsct_active .dsct_line{background-color:var(--dsw-alias-state-business-primary,#4d6bfe);width:12px;height:3px;border-radius:2px}" +
      "@media (prefers-reduced-motion:reduce){.dsct_wrap,.dsct_title,.dsct_line{transition:none}}";
    const tagId = "dsh-chat-timeline/styles.module.css";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-chat-timeline";
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    const styles = {
      nav: "dsct_nav",
      wrap: "dsct_wrap",
      wrapShow: "dsct_show",
      page: "dsct_page",
      item: "dsct_item",
      itemActive: "dsct_active",
      title: "dsct_title",
      titleShow: "dsct_show",
      ind: "dsct_ind",
      line: "dsct_line"
    };
    //#endregion

    //#region dsh-chat-timeline logic（逻辑：数据收集、位置跟踪与跳转 / data collection, position tracking & jumping）
    const NOOP_STORE = { getSnapshot: () => void 0, subscribe: () => () => {} };

    /**
     * 【中文】从用户消息的 ContentBlock 列表提取预览文本。
     * (EN) Extract preview text from a user message's ContentBlock list.
     */
    function userTextOf(content) {
      if (!Array.isArray(content)) return "";
      let out = "";
      for (const block of content) {
        if (block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string") out += block.text;
      }
      return out.trim().slice(0, 80);
    }

    /** 【中文】归一化一条记录为 { seq, time, text, key?, id? }。
     * (EN) Normalize one entry to { seq, time, text, key?, id? }. */
    function normalize(m) {
      if (m === null || typeof m !== "object") return null;
      if (typeof m.seq !== "number") return null;
      return {
        seq: m.seq,
        time: typeof m.time === "number" ? m.time : 0,
        text: typeof m.text === "string" ? m.text : "",
        ...(typeof m.key === "string" ? { key: m.key } : {}),
        ...(typeof m.id === "string" ? { id: m.id } : {})
      };
    }

    /** 【中文】兜底收集器：从已加载的聊天节点枚举用户消息。
     * (EN) Fallback collector: enumerate user messages from the loaded chat nodes. */
    function collectFromNodes(snapshot) {
      const out = [];
      if (snapshot === void 0 || snapshot.chat === void 0) return out;
      for (const node of snapshot.chat.nodes.values()) {
        if (node === null || typeof node !== "object") continue;
        if (node.kind !== "user") continue;
        const data = node.data;
        if (data === null || typeof data !== "object") continue;
        if (typeof data.time !== "number" || !Array.isArray(data.content)) continue;
        const key = typeof node.key === "string" ? node.key : void 0;
        if (key === void 0) continue;
        out.push({ seq: node.anchorSeq, time: data.time, text: userTextOf(data.content), key });
      }
      out.sort((a, b) => a.seq - b.seq);
      return out;
    }

    /** 【中文】解析聊天节点的 data-chat-anchor-key（直接用 key 或按 id 重建）。
     * (EN) Resolve the chat node's data-chat-anchor-key (direct key or reconstructed). */
    function anchorKeyOf(m) {
      if (typeof m.key === "string" && m.key !== "") return m.key;
      if (typeof m.id === "string" && m.id !== "") return "13:input-message" + m.id;
      return void 0;
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /** 【中文】确保消息节点已加载进可视窗口，然后滚动到其所在行。
     * (EN) Ensure the message node is in the loaded window, then scroll to its row. */
    async function jumpToMessage(sessionsService, sessionId, key) {
      const session = sessionsService.binding(sessionId)?.session;
      if (session === void 0) return false;
      let guard = 0;
      while (guard++ < 120) {
        const snapshot = session.getSnapshot();
        if (snapshot?.chat?.nodes?.get(key) !== void 0) break;
        if (snapshot?.hasMore !== true) return false;
        if (snapshot.loadingOlder === true) { await delay(50); continue; }
        await session.loadOlder();
      }
      const scrollport = typeof document !== "undefined" ? document.querySelector("[data-conversation-scroll]") : null;
      const row = scrollport === null ? null : scrollport.querySelector('[data-chat-anchor-key="' + CSS.escape(key) + '"]');
      if (row === null) return false;
      const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      row.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      return true;
    }
    //#endregion

    //#region dsh-chat-timeline components（组件：导航栏本体 / the rail component）
    function TimelineRail({ useProjection, sessionId, sessionsService, t }) {
      const projected = useProjection("dshChatTimeline");
      const session = sessionId === void 0 ? void 0 : sessionsService.binding(sessionId)?.session;
      const fallbackStore = session === void 0 ? NOOP_STORE : session;
      const nodeSnapshot = react.useSyncExternalStore(
        (cb) => fallbackStore.subscribe(cb),
        () => fallbackStore.getSnapshot()
      );

      let messages = [];
      let source = "nodes";
      if (Array.isArray(projected?.messages) && projected.messages.length > 0) {
        messages = projected.messages.map(normalize).filter((m) => m !== null);
        source = "projection";
      }
      if (messages.length === 0) {
        messages = collectFromNodes(nodeSnapshot);
        source = "nodes";
      }

      const [loadedAll, setLoadedAll] = react.useState(false);
      const [activeIndex, setActiveIndex] = react.useState(-1);
      const [show, setShow] = react.useState(false);

      // 【中文】后台加载完整历史：跟随运行时的权威 hasMore 标志，
      // 但一旦投影送达就立刻停止。
      // (EN) Background full-history load: follow the runtime's authoritative
      // hasMore flag, but STOP as soon as the projection delivers.
      react.useEffect(() => {
        if (session === void 0) return;
        setLoadedAll(false);
        if (Array.isArray(projected?.messages) && projected.messages.length > 0) { setLoadedAll(true); return; }
        let cancelled = false;
        const run = async () => {
          let guard = 0;
          while (!cancelled && guard++ < 120) {
            if (Array.isArray(projected?.messages) && projected.messages.length > 0) { setLoadedAll(true); return; }
            const snap = session.getSnapshot();
            if (snap?.hasMore !== true) { setLoadedAll(true); return; }
            if (snap.loadingOlder === true) { await delay(50); continue; }
            await session.loadOlder();
          }
          if (!cancelled) setLoadedAll(true);
        };
        run().catch(() => { if (!cancelled) setLoadedAll(true); });
        return () => { cancelled = true; };
      }, [sessionId, session === void 0 ? "none" : "ready", Array.isArray(projected?.messages) && projected.messages.length > 0 ? "have" : "none"]);

      // 【中文】跟踪阅读位置（当前高亮的消息项）。
      // (EN) Track the reading position (active item).
      react.useEffect(() => {
        if (messages.length === 0) return;
        const messageIndexByKey = new Map();
        for (let i = 0; i < messages.length; i++) {
          const key = anchorKeyOf(messages[i]);
          if (key !== void 0) messageIndexByKey.set(key, i);
        }
        const updateActive = () => {
          const sp = document.querySelector("[data-conversation-scroll]");
          if (sp === null) return;
          const rect = sp.getBoundingClientRect();
          if (rect.height === 0) return;
          const line = rect.top + rect.height * 0.4;
          const rows = sp.querySelectorAll('[data-chat-anchor-key^="13:input-message"]');
          let best = -1;
          let bestDist = Infinity;
          for (const row of rows) {
            const key = row.getAttribute("data-chat-anchor-key");
            if (key === null) continue;
            const idx = messageIndexByKey.get(key) ?? -1;
            if (idx === -1) continue;
            const r = row.getBoundingClientRect();
            const dist = Math.abs(r.top + r.height / 2 - line);
            if (dist < bestDist) { bestDist = dist; best = idx; }
          }
          setActiveIndex(best);
        };
        updateActive();
        const el = document.querySelector("[data-conversation-scroll]");
        let scrollTimer = null;
        const onScroll = () => {
          if (scrollTimer !== null) return;
          scrollTimer = setTimeout(() => { scrollTimer = null; updateActive(); }, 60);
        };
        el === null ? void 0 : el.addEventListener("scroll", onScroll, { passive: true });
        const timer = setInterval(updateActive, 2000);
        return () => {
          if (scrollTimer !== null) clearTimeout(scrollTimer);
          el === null ? void 0 : el.removeEventListener("scroll", onScroll);
          clearInterval(timer);
        };
      }, [sessionId, messages.length, source]);

      if (sessionId === void 0 || messages.length < 2) return null;

      return react_dom.createPortal(
        (0, react_jsx_runtime.jsx)("div", {
          className: styles.nav,
          role: "navigation",
          "aria-label": t("railLabel"),
          onMouseEnter: () => setShow(true),
          onMouseLeave: () => setShow(false),
          children: (0, react_jsx_runtime.jsx)("div", {
            className: styles.wrap + (show ? " " + styles.wrapShow : ""),
            children: (0, react_jsx_runtime.jsx)("div", {
                className: styles.page,
                children: messages.map((m, i) => {
                  const key = anchorKeyOf(m);
                  return (0, react_jsx_runtime.jsx)("button", {
                    type: "button",
                    className: styles.item + (activeIndex === i ? " " + styles.itemActive : ""),
                    title: m.text === "" ? t("noText") : m.text.slice(0, 200),
                    "aria-label": t("roleUser") + ": " + (m.text.slice(0, 60) || t("noText")),
                    "aria-current": activeIndex === i ? "location" : void 0,
                    onClick: () => { if (key === void 0) return; jumpToMessage(sessionsService, sessionId, key).catch(() => {}); },
                    children: [
                      (0, react_jsx_runtime.jsx)("span", {
                        className: styles.title + (show ? " " + styles.titleShow : ""),
                        children: m.text === "" ? t("noText") : m.text
                      }),
                      (0, react_jsx_runtime.jsx)("span", {
                        className: styles.ind,
                        "aria-hidden": true,
                        children: (0, react_jsx_runtime.jsx)("span", { className: styles.line })
                      })
                    ]
                  }, m.seq);
                })
              })
            })
          }),
        document.body
      );
    }
    //#endregion

    //#region dsh-chat-timeline plugin body（插件主体：插槽注入与多语言 / slot injection & locale）
    const NS = "chat-timeline";
    const inject = ["slots", "locale", "sessions"];
    // 【中文】中文语言包（默认界面语言）。
    // (EN) Chinese locale dictionary (default UI language).
    const zh = {
      "railLabel": "对话时间线",
      "roleUser": "用户",
      "noText": "（无文本内容）"
    };
    // 【中文】英文语言包（可通过 DSH 界面语言设置切换）。
    // (EN) English locale dictionary (switchable via DSH UI language setting).
    const en = {
      "railLabel": "Chat timeline",
      "roleUser": "User",
      "noText": "(no text)"
    };

    function apply(ctx) {
      // 【中文】注册中英文语言包。
      // (EN) Register zh/en locale dictionaries.
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "chat-timeline: dictionaries");
      // 【中文】把 TimelineRail 组件注入 conversation.input.dock 插槽。
      // (EN) Inject the TimelineRail component into the conversation.input.dock slot.
      ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
        name: "conversation.input.dock",
        id: "chat-timeline",
        order: 40,
        locale: NS,
        inject: () => ({ sessionsService: ctx.sessions })
      }, TimelineRail));
    }
    //#endregion

    exports.TimelineRail = TimelineRail;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
