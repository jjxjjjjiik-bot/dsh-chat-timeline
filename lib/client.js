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

    if (typeof window !== "undefined" && !window.__DSCT_BANNER_PRINTED__) {
      window.__DSCT_BANNER_PRINTED__ = true;
      console.log(
        "%c dsh-chat-timeline %c v0.1.3 %c ⭐ https://github.com/jjxjjjjiik-bot/dsh-chat-timeline ",
        "background:#4d6bfe;color:#fff;font-weight:600;padding:2px 6px;border-radius:4px 0 0 4px;",
        "background:#2b2d31;color:#fff;padding:2px 6px;",
        "background:#f3f4f6;color:#374151;border-radius:0 4px 4px 0;padding:2px 6px;"
      );
    }

    let react_jsx_runtime = require("react/jsx-runtime");
    let react = require("react");
    let react_dom = require("react-dom");

    //#region dsh-chat-timeline styles（样式：DeepSeek 网页版 ScrollNav 1:1 官方完整还原与双主题适配）
    /* 【中文】窄屏断点：视口宽度 ≤ 该值时隐藏导航轨（手机等窄屏下避免遮挡对话内容）。
     * (EN) Narrow-viewport breakpoint: hide the rail when the viewport is at or
     * below this width (phones and other narrow screens, avoiding occlusion). */
    const MOBILE_MAX_WIDTH = 767;
    const css =
      /* 官方外层定位器（34px 轨宽，50% 垂直居中，用户选择禁用） */
      ".dsct_nav{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:100;align-items:center;width:34px;height:300px;transition:all .2s ease;display:flex;position:fixed;top:50%;bottom:50%;right:16px;transform:translateY(-50%);pointer-events:auto}" +
      /* 官方折叠背景胶囊（5px 毛玻璃，未悬停时浅色为 rgba(255,255,255,.8)，深色为 rgba(21,21,23,.6)） */
      ".dsct_bg{-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);z-index:-1;background-color:rgba(255,255,255,.8);border-radius:16px;width:34px;height:calc(100% - 8px);max-height:calc(100% - 8px);position:absolute;top:50%;right:0;transform:translateY(-50%);transition:opacity .2s ease;pointer-events:none}" +
      "body[data-ds-dark-theme] .dsct_bg,[data-theme='dark'] .dsct_bg,.dark .dsct_bg{background-color:rgba(21,21,23,.6)}" +
      ".dsct_bg.dsct_bghide{opacity:0}" +
      /* 官方展开面板容器（fit-content, max 240px, 16px 圆角） */
      ".dsct_wrap{width:-moz-fit-content;width:fit-content;max-width:240px;max-height:100%;border:1px solid transparent;border-radius:16px;flex-direction:column;align-items:stretch;transition:width .22s cubic-bezier(0.4,0,0.2,1),background .2s ease,box-shadow .2s ease,border-color .2s ease;display:flex;position:absolute;right:0;overflow:hidden;box-sizing:border-box;background:transparent;pointer-events:none}" +
      ".dsct_wrap.dsct_max{width:240px}" +
      /* 浅色主题悬停展开（白底毛玻璃 + 官方阴影 + 浅边框） */
      ".dsct_wrap.dsct_show{pointer-events:auto;background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,.08);box-shadow:0 10px 30px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.04)}" +
      /* 深色主题悬停展开（黑底毛玻璃 + 官方深色阴影） */
      "body[data-ds-dark-theme] .dsct_wrap.dsct_show,[data-theme='dark'] .dsct_wrap.dsct_show,.dark .dsct_wrap.dsct_show{background:rgba(28,28,32,.95);border:1px solid rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25)}" +
      /* 官方滚动区（max-height: 250px, 官方 padding: 15px 0 15px 24px） */
      ".dsct_page{max-height:250px;padding:15px 0 15px 24px;box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;align-items:flex-end;display:flex;position:relative;width:100%;overflow:hidden}" +
      ".dsct_wrap.dsct_show .dsct_page{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}" +
      "body[data-ds-dark-theme] .dsct_wrap.dsct_show .dsct_page,[data-theme='dark'] .dsct_wrap.dsct_show .dsct_page,.dark .dsct_wrap.dsct_show .dsct_page{scrollbar-color:rgba(255,255,255,.25) transparent}" +
      ".dsct_page::-webkit-scrollbar{width:4px}" +
      ".dsct_page::-webkit-scrollbar-track{background:transparent}" +
      ".dsct_page::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px}" +
      ".dsct_page::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.35)}" +
      "body[data-ds-dark-theme] .dsct_page::-webkit-scrollbar-thumb,[data-theme='dark'] .dsct_page::-webkit-scrollbar-thumb,.dark .dsct_page::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25)}" +
      "body[data-ds-dark-theme] .dsct_page::-webkit-scrollbar-thumb:hover,[data-theme='dark'] .dsct_page::-webkit-scrollbar-thumb:hover,.dark .dsct_page::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.45)}" +
      /* 官方单项（height: 30px, 浅色文字 rgba(0,0,0,.65) / 深色文字 rgba(255,255,255,.65)） */
      ".dsct_item{cursor:pointer;height:30px;min-height:30px;justify-content:flex-end;align-items:center;width:calc(100% - 6px);margin-right:8px;line-height:20px;display:flex;background:none;border:none;font:inherit;text-align:right;box-sizing:border-box;padding:0;transition:color .15s ease;flex-shrink:0;color:rgba(0,0,0,.65)}" +
      ".dsct_item:hover{color:rgba(0,0,0,.95)}" +
      ".dsct_item.dsct_active{color:var(--dsw-alias-state-business-primary,#4d6bfe)}" +
      "body[data-ds-dark-theme] .dsct_item,[data-theme='dark'] .dsct_item,.dark .dsct_item{color:rgba(255,255,255,.65)}" +
      "body[data-ds-dark-theme] .dsct_item:hover,[data-theme='dark'] .dsct_item:hover,.dark .dsct_item:hover{color:rgba(255,255,255,.95)}" +
      /* 官方标题文字（13px, 居右, 悬停展开渐入） */
      ".dsct_title{font-size:13px;line-height:20px;text-overflow:ellipsis;white-space:nowrap;opacity:0;margin-right:12px;flex:1;min-width:0;text-align:right;overflow:hidden;transition:opacity .12s ease,color .15s ease;color:inherit}" +
      ".dsct_title.dsct_show{opacity:1}" +
      ".dsct_item.dsct_active .dsct_title{color:var(--dsw-alias-state-business-primary,#4d6bfe);font-weight:500}" +
      /* 官方指示线（16×20px 容器，8×2px 线，激活时 scale(1.5) 放大并变蓝） */
      ".dsct_ind{flex-shrink:0;justify-content:center;align-items:center;width:16px;height:20px;display:flex}" +
      ".dsct_line{background-color:rgba(0,0,0,.16);border-radius:4px;flex-shrink:0;width:8px;height:2px;transition:background-color .2s ease,transform .2s ease}" +
      ".dsct_item:hover .dsct_line{background-color:rgba(0,0,0,.85)}" +
      ".dsct_item.dsct_active .dsct_line{background-color:var(--dsw-alias-state-business-primary,#4d6bfe);transform-origin:50%;transform:scale(1.5)}" +
      "body[data-ds-dark-theme] .dsct_line,[data-theme='dark'] .dsct_line,.dark .dsct_line{background-color:rgba(255,255,255,.2)}" +
      "body[data-ds-dark-theme] .dsct_item:hover .dsct_line,[data-theme='dark'] .dsct_item:hover .dsct_line,.dark .dsct_item:hover .dsct_line{background-color:rgba(255,255,255,.9)}" +
      "body[data-ds-dark-theme] .dsct_item.dsct_active .dsct_line,[data-theme='dark'] .dsct_item.dsct_active .dsct_line,.dark .dsct_item.dsct_active .dsct_line{background-color:var(--dsw-alias-state-business-primary,#4d6bfe)}" +
      "@media (prefers-reduced-motion:reduce){.dsct_nav,.dsct_wrap,.dsct_title,.dsct_line{transition:none}}" +
      /* 【中文】窄屏隐藏导航轨（JS 守卫之外的第二道保险，React 挂载前即生效）。
       * (EN) Hide the rail on narrow viewports — a second guard beyond the JS
       * one, effective before React mounts. */
      "@media (max-width:" + MOBILE_MAX_WIDTH + "px){.dsct_nav{display:none}}";
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
      bg: "dsct_bg",
      bgHide: "dsct_bghide",
      wrap: "dsct_wrap",
      wrapMax: "dsct_max",
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

    /** 【中文】只滚动时间线自身，以最小距离让当前高亮项进入可视区域。
     * (EN) Scroll only the timeline itself, by the minimum distance needed to
     * reveal the active item. */
    function scrollTimelineItemIntoView(page, item) {
      const pageRect = page.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      if (itemRect.top < pageRect.top) {
        page.scrollTop -= pageRect.top - itemRect.top;
      } else if (itemRect.bottom > pageRect.bottom) {
        page.scrollTop += itemRect.bottom - pageRect.bottom;
      }
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
      const [rightOffset, setRightOffset] = react.useState(12);
      const pageRef = react.useRef(null);
      const activeItemRef = react.useRef(null);

      // 【中文】窄屏守卫：视口 ≤ 断点时整个组件不渲染（也跳过后台历史加载）。
      // 监听媒体查询变化，旋转屏幕/拉伸窗口后自动恢复。
      // (EN) Narrow-viewport guard: render nothing (and skip the background
      // history load) below the breakpoint; listens to the media query so
      // rotating or resizing the window restores the rail automatically.
      const [isNarrow, setIsNarrow] = react.useState(
        () => typeof window !== "undefined" && typeof window.matchMedia === "function"
          && window.matchMedia("(max-width:" + MOBILE_MAX_WIDTH + "px)").matches
      );
      react.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
        const mql = window.matchMedia("(max-width:" + MOBILE_MAX_WIDTH + "px)");
        const onChange = (e) => setIsNarrow(e.matches);
        if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
        else if (typeof mql.addListener === "function") mql.addListener(onChange); // 旧版 Safari 回退 / legacy Safari fallback
        return () => {
          if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
          else if (typeof mql.removeListener === "function") mql.removeListener(onChange);
        };
      }, []);

      // 【中文】后台加载完整历史：跟随运行时的权威 hasMore 标志，
      // 但一旦投影送达就立刻停止。
      // (EN) Background full-history load: follow the runtime's authoritative
      // hasMore flag, but STOP as soon as the projection delivers.
      react.useEffect(() => {
        if (session === void 0 || isNarrow) return;
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
      }, [sessionId, isNarrow, session === void 0 ? "none" : "ready", Array.isArray(projected?.messages) && projected.messages.length > 0 ? "have" : "none"]);

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

      // 【中文】高亮项变化后同步时间线自己的滚动位置；已经可见时保持不动。
      // (EN) Keep the active item visible inside the timeline without moving
      // the conversation or document scrollports.
      react.useLayoutEffect(() => {
        const page = pageRef.current;
        const item = activeItemRef.current;
        if (page === null || item === null) return;
        scrollTimelineItemIntoView(page, item);
      }, [activeIndex, messages.length, isNarrow]);

      // 【中文】动态避让右侧工作台：按聊天滚动区右缘计算导航栏 right，避免与 aionui 等右栏重叠。
      // (EN) Dynamically avoid right-side workbenches: compute the rail's right offset from the conversation scrollport.
      react.useEffect(() => {
        let raf = 0;
        const measure = () => {
          raf = 0;
          const sp = document.querySelector("[data-conversation-scroll]");
          if (sp === null) return;
          const rect = sp.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;
          const next = Math.max(8, Math.round(window.innerWidth - rect.right + 12));
          setRightOffset((prev) => Math.abs(prev - next) > 0.5 ? next : prev);
        };
        const schedule = () => {
          if (raf !== 0) return;
          raf = window.requestAnimationFrame(measure);
        };
        const sp = document.querySelector("[data-conversation-scroll]");
        const ro = typeof ResizeObserver === "function" && sp !== null ? new ResizeObserver(schedule) : null;
        if (ro !== null && sp !== null) ro.observe(sp);
        const mo = typeof MutationObserver === "function" ? new MutationObserver(schedule) : null;
        if (mo !== null && sp !== null) mo.observe(sp, { attributes: true, attributeFilter: ["style"] });
        window.addEventListener("resize", schedule);
        const timer = window.setInterval(schedule, 2000);
        measure();
        return () => {
          if (raf !== 0) cancelAnimationFrame(raf);
          if (ro !== null) ro.disconnect();
          if (mo !== null) mo.disconnect();
          window.removeEventListener("resize", schedule);
          window.clearInterval(timer);
        };
      }, [sessionId]);

      if (sessionId === void 0 || isNarrow || messages.length < 2) return null;

      return react_dom.createPortal(
        (0, react_jsx_runtime.jsxs)("div", {
          className: styles.nav,
          style: { right: rightOffset + "px" },
          role: "navigation",
          "aria-label": t("railLabel"),
          onMouseEnter: () => setShow(true),
          onMouseLeave: () => setShow(false),
          children: [
            (0, react_jsx_runtime.jsx)("div", {
              className: styles.bg + (show ? " " + styles.bgHide : "")
            }),
            (0, react_jsx_runtime.jsx)("div", {
              className: styles.wrap + (messages.length > 8 ? " " + styles.wrapMax : "") + (show ? " " + styles.wrapShow : ""),
              children: (0, react_jsx_runtime.jsx)("div", {
                className: styles.page,
                ref: pageRef,
                children: messages.map((m, i) => {
                  const key = anchorKeyOf(m);
                  return (0, react_jsx_runtime.jsxs)("button", {
                    type: "button",
                    ref: activeIndex === i ? activeItemRef : void 0,
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
          ]
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
    exports.scrollTimelineItemIntoView = scrollTimelineItemIntoView;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
