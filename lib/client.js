/**
 * dsh-chat-timeline — web client half（Web 客户端侧）。
 *
 * 【中文】官方 DeepSeek 网页应用 ScrollNav（对话滚动导航栏）的 1:1 移植与增强：
 *
 * (EN) A 1:1 port and enhancement of the DeepSeek official web app's ScrollNav
 * (conversation scroll-navigation rail):
 *
 * 【中文】- 折叠态：固定在右缘、垂直居中、34×300px 细竖轨，带毛玻璃半透明背景；
 *   每条用户消息对应一条指示线（普通灰色、重点标记为高亮金色）。
 * (EN) - collapsed: a fixed vertical rail at the right edge, vertically centered,
 *   with a blurred translucent backdrop; every user message shows as an indicator
 *   line (grey normally, golden when marked as key point).
 *
 * 【中文】- 悬停展开面板：显示消息预览卡片、重点星标（★）、顶部「只看标记」筛选栏。
 * (EN) - expanded on hover: displays preview cards, star bookmark toggle (★),
 *   and a "Marked only" filter header.
 *
 * 【中文】- 丝滑定位与防抖：平滑跳转期间自动冻结高亮更新与面板瞬移，滚动完全静止后
 *   精准对齐目标项，彻底消除抽搐抖动。
 * (EN) - smooth jump stabilization: freezes active-item updates during smooth scrolling
 *   and settles cleanly once scrolling stops, eliminating jitters completely.
 *
 * 【中文】- 消息撤回兼容：与 dsh-rewind 深度联动，被回退/撤回的消息自动移出时间线。
 * (EN) - rewind integration: compatible with dsh-rewind; withdrawn messages are
 *   automatically filtered out.
 *
 * 【中文】- 全模式主题适配：浅色模式（白底毛玻璃+雅金+灰线）与深色模式（黑底毛玻璃+亮金）。
 * (EN) - dual theme support: full light & dark mode styling with matching contrast.
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
        "%c dsh-chat-timeline %c v0.1.4 %c ⭐ https://github.com/jjxjjjjiik-bot/dsh-chat-timeline ",
        "background:#4d6bfe;color:#fff;font-weight:600;padding:2px 6px;border-radius:4px 0 0 4px;",
        "background:#2b2d31;color:#fff;padding:2px 6px;",
        "background:#f3f4f6;color:#374151;border-radius:0 4px 4px 0;padding:2px 6px;"
      );
    }

    let react_jsx_runtime = require("react/jsx-runtime");
    let react = require("react");
    let react_dom = require("react-dom");

    //#region dsh-chat-timeline styles（样式：DeepSeek 官网 1:1 双主题适配与书签增强）
    const css =
      /* 官方外层定位器（34px 轨宽，50% 垂直居中，用户选择禁用） */
      ".dsct_nav{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:100;align-items:center;width:34px;height:300px;transition:right .2s ease,opacity .2s ease;display:flex;position:fixed;top:50%;bottom:50%;right:16px;transform:translateY(-50%);pointer-events:auto}" +
      /* 折叠背景胶囊（5px 毛玻璃，浅色 rgba(255,255,255,.8)，深色 rgba(21,21,23,.6)） */
      ".dsct_bg{-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);z-index:-1;background-color:rgba(255,255,255,.8);border-radius:16px;width:34px;height:calc(100% - 8px);max-height:calc(100% - 8px);position:absolute;top:50%;right:0;transform:translateY(-50%);transition:opacity .2s ease;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.04)}" +
      "body[data-ds-dark-theme] .dsct_bg,[data-theme='dark'] .dsct_bg,.dark .dsct_bg{background-color:rgba(21,21,23,.6);box-shadow:0 2px 8px rgba(0,0,0,.25)}" +
      ".dsct_bg.dsct_bghide{opacity:0}" +
      /* 展开面板容器（fit-content, max 260px, 16px 圆角） */
      ".dsct_wrap{width:-moz-fit-content;width:fit-content;max-width:260px;max-height:100%;border:1px solid transparent;border-radius:16px;flex-direction:column;align-items:stretch;transition:width .22s cubic-bezier(0.4,0,0.2,1),background .2s ease,box-shadow .2s ease,border-color .2s ease;display:flex;position:absolute;right:0;overflow:hidden;box-sizing:border-box;background:transparent;pointer-events:none}" +
      ".dsct_wrap.dsct_max{width:260px}" +
      /* 浅色主题悬停展开（白底毛玻璃 + 阴影 + 浅边框） */
      ".dsct_wrap.dsct_show{pointer-events:auto;background:rgba(255,255,255,.95);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(0,0,0,.08);box-shadow:0 10px 30px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.04)}" +
      /* 深色主题悬停展开（黑底毛玻璃 + 深色阴影） */
      "body[data-ds-dark-theme] .dsct_wrap.dsct_show,[data-theme='dark'] .dsct_wrap.dsct_show,.dark .dsct_wrap.dsct_show{background:rgba(28,28,32,.95);border:1px solid rgba(255,255,255,.08);box-shadow:0 10px 30px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.25)}" +
      /* 顶部筛选栏 */
      ".dsct_filter{padding:8px 12px 4px 12px;display:flex;justify-content:flex-end;align-items:center;border-bottom:1px solid rgba(0,0,0,.05);box-sizing:border-box}" +
      "body[data-ds-dark-theme] .dsct_filter,[data-theme='dark'] .dsct_filter,.dark .dsct_filter{border-bottom:1px solid rgba(255,255,255,.06)}" +
      ".dsct_filter_btn{font-size:11px;line-height:16px;padding:2px 8px;border-radius:10px;border:1px solid rgba(0,0,0,.1);background:rgba(0,0,0,.03);color:rgba(0,0,0,.65);cursor:pointer;transition:all .15s ease;display:inline-flex;align-items:center;gap:3px}" +
      ".dsct_filter_btn:hover{background:rgba(0,0,0,.07);color:rgba(0,0,0,.9)}" +
      ".dsct_filter_btn.dsct_filter_on{background:rgba(245,158,11,.12);border-color:#f59e0b;color:#b45309;font-weight:600}" +
      "body[data-ds-dark-theme] .dsct_filter_btn,[data-theme='dark'] .dsct_filter_btn,.dark .dsct_filter_btn{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.7)}" +
      "body[data-ds-dark-theme] .dsct_filter_btn:hover,[data-theme='dark'] .dsct_filter_btn:hover,.dark .dsct_filter_btn:hover{background:rgba(255,255,255,.1);color:rgba(255,255,255,.95)}" +
      "body[data-ds-dark-theme] .dsct_filter_btn.dsct_filter_on,[data-theme='dark'] .dsct_filter_btn.dsct_filter_on,.dark .dsct_filter_btn.dsct_filter_on{background:rgba(251,191,36,.18);border-color:#fbbf24;color:#fbbf24;font-weight:600}" +
      /* 折叠态隐藏「只看标记」筛选栏（含其下分隔线），仅展开面板显示 */
      ".dsct_wrap:not(.dsct_show) .dsct_filter{display:none}" +
      /* 滚动内容区（max-height: 240px） */
      ".dsct_page{max-height:240px;padding:8px 0 10px 14px;box-sizing:border-box;overscroll-behavior:contain;flex-direction:column;align-items:flex-end;display:flex;position:relative;width:100%;overflow:hidden}" +
      ".dsct_wrap.dsct_show .dsct_page{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}" +
      "body[data-ds-dark-theme] .dsct_wrap.dsct_show .dsct_page,[data-theme='dark'] .dsct_wrap.dsct_show .dsct_page,.dark .dsct_wrap.dsct_show .dsct_page{scrollbar-color:rgba(255,255,255,.25) transparent}" +
      ".dsct_page::-webkit-scrollbar{width:4px}" +
      ".dsct_page::-webkit-scrollbar-track{background:transparent}" +
      ".dsct_page::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px}" +
      ".dsct_page::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.35)}" +
      "body[data-ds-dark-theme] .dsct_page::-webkit-scrollbar-thumb,[data-theme='dark'] .dsct_page::-webkit-scrollbar-thumb,.dark .dsct_page::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25)}" +
      "body[data-ds-dark-theme] .dsct_page::-webkit-scrollbar-thumb:hover,[data-theme='dark'] .dsct_page::-webkit-scrollbar-thumb:hover,.dark .dsct_page::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.45)}" +
      /* 空状态提示 */
      ".dsct_empty{font-size:12px;line-height:18px;padding:16px 12px;color:rgba(0,0,0,.45);text-align:center;width:100%;box-sizing:border-box}" +
      "body[data-ds-dark-theme] .dsct_empty,[data-theme='dark'] .dsct_empty,.dark .dsct_empty{color:rgba(255,255,255,.45)}" +
      /* 单条消息项 */
      ".dsct_item{cursor:pointer;height:30px;min-height:30px;justify-content:flex-end;align-items:center;width:calc(100% - 4px);margin-right:4px;line-height:20px;display:flex;background:none;border:none;font:inherit;text-align:right;box-sizing:border-box;padding:0;transition:color .15s ease;flex-shrink:0;color:rgba(0,0,0,.65)}" +
      ".dsct_item:hover{color:rgba(0,0,0,.95)}" +
      ".dsct_item.dsct_active{color:var(--dsw-alias-state-business-primary,#4d6bfe)}" +
      "body[data-ds-dark-theme] .dsct_item,[data-theme='dark'] .dsct_item,.dark .dsct_item{color:rgba(255,255,255,.65)}" +
      "body[data-ds-dark-theme] .dsct_item:hover,[data-theme='dark'] .dsct_item:hover,.dark .dsct_item:hover{color:rgba(255,255,255,.95)}" +
      "body[data-ds-dark-theme] .dsct_item.dsct_active,[data-theme='dark'] .dsct_item.dsct_active,.dark .dsct_item.dsct_active{color:var(--dsw-alias-state-business-primary,#4d6bfe)}" +
      /* 标题文字（悬停展开渐入） */
      ".dsct_title{font-size:13px;line-height:20px;text-overflow:ellipsis;white-space:nowrap;opacity:0;margin-right:6px;flex:1;min-width:0;text-align:right;overflow:hidden;transition:opacity .12s ease,color .15s ease;color:inherit}" +
      ".dsct_title.dsct_show{opacity:1}" +
      ".dsct_item.dsct_active .dsct_title{color:var(--dsw-alias-state-business-primary,#4d6bfe);font-weight:500}" +
      /* 重点标记星星按钮 */
      ".dsct_star{font-size:13px;line-height:16px;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;opacity:0;cursor:pointer;transition:all .15s ease;margin-right:6px;flex-shrink:0;color:rgba(0,0,0,.25);border-radius:4px}" +
      ".dsct_wrap.dsct_show .dsct_item:hover .dsct_star{opacity:.75}" +
      ".dsct_wrap.dsct_show .dsct_star:hover{opacity:1;transform:scale(1.2);color:#d97706}" +
      ".dsct_wrap.dsct_show .dsct_star.dsct_star_on{opacity:1;color:#f59e0b}" +
      "body[data-ds-dark-theme] .dsct_star,[data-theme='dark'] .dsct_star,.dark .dsct_star{color:rgba(255,255,255,.25)}" +
      "body[data-ds-dark-theme] .dsct_wrap.dsct_show .dsct_star:hover,[data-theme='dark'] .dsct_wrap.dsct_show .dsct_star:hover,.dark .dsct_wrap.dsct_show .dsct_star:hover{color:#fde047}" +
      "body[data-ds-dark-theme] .dsct_wrap.dsct_show .dsct_star.dsct_star_on,[data-theme='dark'] .dsct_wrap.dsct_show .dsct_star.dsct_star_on,.dark .dsct_wrap.dsct_show .dsct_star.dsct_star_on{opacity:1;color:#fbbf24}" +
      /* 指示线容器与指示线本体 */
      ".dsct_ind{flex-shrink:0;justify-content:center;align-items:center;width:16px;height:20px;display:flex}" +
      ".dsct_line{background-color:rgba(0,0,0,.16);border-radius:4px;flex-shrink:0;width:8px;height:2px;transition:background-color .2s ease,transform .2s ease,width .2s ease,height .2s ease}" +
      ".dsct_item:hover .dsct_line{background-color:rgba(0,0,0,.85)}" +
      ".dsct_item.dsct_active .dsct_line{background-color:var(--dsw-alias-state-business-primary,#4d6bfe);transform-origin:50%;transform:scale(1.5)}" +
      "body[data-ds-dark-theme] .dsct_line,[data-theme='dark'] .dsct_line,.dark .dsct_line{background-color:rgba(255,255,255,.2)}" +
      "body[data-ds-dark-theme] .dsct_item:hover .dsct_line,[data-theme='dark'] .dsct_item:hover .dsct_line,.dark .dsct_item:hover .dsct_line{background-color:rgba(255,255,255,.9)}" +
      "body[data-ds-dark-theme] .dsct_item.dsct_active .dsct_line,[data-theme='dark'] .dsct_item.dsct_active .dsct_line,.dark .dsct_item.dsct_active .dsct_line{background-color:var(--dsw-alias-state-business-primary,#4d6bfe)}" +
      /* 已标记重点的指示线（高亮金色） */
      ".dsct_item.dsct_marked .dsct_line{background-color:#d97706;width:10px;height:2.5px}" +
      ".dsct_item.dsct_marked:hover .dsct_line{background-color:#b45309}" +
      ".dsct_item.dsct_marked.dsct_active .dsct_line{background-color:var(--dsw-alias-state-business-primary,#4d6bfe);transform-origin:50%;transform:scale(1.5)}" +
      "body[data-ds-dark-theme] .dsct_item.dsct_marked .dsct_line,[data-theme='dark'] .dsct_item.dsct_marked .dsct_line,.dark .dsct_item.dsct_marked .dsct_line{background-color:#fbbf24;width:10px;height:2.5px}" +
      "body[data-ds-dark-theme] .dsct_item.dsct_marked:hover .dsct_line,[data-theme='dark'] .dsct_item.dsct_marked:hover .dsct_line,.dark .dsct_item.dsct_marked:hover .dsct_line{background-color:#fde047}" +
      "@media (prefers-reduced-motion:reduce){.dsct_nav,.dsct_wrap,.dsct_title,.dsct_line,.dsct_star,.dsct_filter_btn{transition:none}}";

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
      filter: "dsct_filter",
      filterBtn: "dsct_filter_btn",
      filterOn: "dsct_filter_on",
      page: "dsct_page",
      empty: "dsct_empty",
      item: "dsct_item",
      itemActive: "dsct_active",
      marked: "dsct_marked",
      title: "dsct_title",
      titleShow: "dsct_show",
      star: "dsct_star",
      starOn: "dsct_star_on",
      ind: "dsct_ind",
      line: "dsct_line"
    };
    //#endregion

    //#region dsh-chat-timeline logic（逻辑：数据收集、回退过滤、书签存储与防抖跳转）
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

    /** 【中文】获取标记 key（优先稳定 id / key，兜底 seq）。
     * (EN) Stable bookmark key for a message entry. */
    function markKeyOf(m) {
      if (m === null || typeof m !== "object") return "";
      if (typeof m.id === "string" && m.id !== "") return "id:" + m.id;
      if (typeof m.key === "string" && m.key !== "") return "key:" + m.key;
      return "seq:" + String(m.seq);
    }

    const MARKS_STORAGE_PREFIX = "dsct_marks_";

    /** 【中文】从 localStorage 读取该会话的已标记列表。
     * (EN) Read marked message keys for a session from localStorage. */
    function readMarks(sessionId) {
      if (typeof window === "undefined" || !sessionId) return [];
      try {
        const raw = window.localStorage.getItem(MARKS_STORAGE_PREFIX + sessionId);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    /** 【中文】把已标记列表持久化到 localStorage。
     * (EN) Write marked message keys for a session to localStorage. */
    function writeMarks(sessionId, marks) {
      if (typeof window === "undefined" || !sessionId) return;
      try {
        if (!Array.isArray(marks) || marks.length === 0) {
          window.localStorage.removeItem(MARKS_STORAGE_PREFIX + sessionId);
        } else {
          window.localStorage.setItem(MARKS_STORAGE_PREFIX + sessionId, JSON.stringify(marks));
        }
      } catch {}
    }

    /** 【中文】辅助函数：从数值或字符串中安全提取 seq 数字。
     * (EN) Helper: safely extract seq number from number or string. */
    function parseSeqNumber(val) {
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (typeof val === "string") {
        const m = val.match(/(?:@|seq\s*|#)?(\d+)/i);
        if (m) {
          const n = parseInt(m[1], 10);
          if (Number.isFinite(n)) return n;
        }
      }
      return void 0;
    }

    /** 【中文】从回退提示文案中解析目标事件 seq（兼容中英文真实文案及 #42 / seq 42 格式）。
     * (EN) Extract target seq from a rewind outcome text message. */
    function rewindTargetOfOutcome(text) {
      if (typeof text !== "string") return void 0;
      // 优先匹配标准 seq 声明（如 "已撤回 seq 42 及之后...", "Withdrawn seq 42..."）
      const seqMatch = text.match(/seq\s*(\d+)/i);
      if (seqMatch !== null) {
        const n = parseInt(seqMatch[1], 10);
        if (Number.isFinite(n)) return n;
      }
      // 兼容 #42 格式
      const hashMatch = text.match(/#(\d+)/);
      if (hashMatch !== null) {
        const n = parseInt(hashMatch[1], 10);
        if (Number.isFinite(n)) return n;
      }
      // 兼容 rewound/withdrawn/已撤回 ... (\d+)
      const broadMatch = text.match(/(?:rewound|withdrawn|已撤回).*?(?:target\s+)?(\d+)/i);
      if (broadMatch !== null) {
        const n = parseInt(broadMatch[1], 10);
        if (Number.isFinite(n)) return n;
      }
      return void 0;
    }

    /** 【中文】从回退指令解析目标事件 seq（多层防御式解析：结构化参数优先，多正则文案兜底）。
     * (EN) Extract target seq from a rewind command (multi-layered: structured args first, fallback to regex). */
    function rewindTargetOfCommand(command) {
      if (command === null || typeof command !== "object") return void 0;

      // 1. 结构化字段检测（outcome 属性 / structured outcome props）
      const outcome = command.outcome;
      if (outcome && typeof outcome === "object") {
        if (typeof outcome.targetSeq === "number" && Number.isFinite(outcome.targetSeq)) return outcome.targetSeq;
        if (typeof outcome.target === "number" && Number.isFinite(outcome.target)) return outcome.target;
      }

      // 2. 结构化命令参数检测（command.args: @42, targetSeq, target, etc.）
      const args = command.args;
      if (args !== null && typeof args === "object") {
        if (typeof args.targetSeq === "number" && Number.isFinite(args.targetSeq)) return args.targetSeq;
        if (typeof args.target === "number" && Number.isFinite(args.target)) return args.target;
        if (typeof args.seq === "number" && args.seq !== command.seq && Number.isFinite(args.seq)) return args.seq;
        if (typeof args.raw === "string") {
          const n = parseSeqNumber(args.raw);
          if (n !== void 0) return n;
        }
        if (args["0"] !== void 0) {
          const n = parseSeqNumber(args["0"]);
          if (n !== void 0) return n;
        }
        if (typeof args.target === "string") {
          const n = parseSeqNumber(args.target);
          if (n !== void 0) return n;
        }
        if (Array.isArray(args) && args.length > 0) {
          const n = parseSeqNumber(args[0]);
          if (n !== void 0) return n;
        }
      }

      // 3. 多模式文案正则解析兜底（兼容 dsh-rewind 各版本中英文真实成功文案）
      if (outcome && typeof outcome.text === "string") {
        return rewindTargetOfOutcome(outcome.text);
      }

      return void 0;
    }

    function isRewindPreviewCommand(command) {
      const args = command.args;
      if (args === null || typeof args !== "object") return false;
      return args.preview === true || args.dryRun === true;
    }

    /** 【中文】从聊天节点中提取被 dsh-rewind 剪切/隐藏的 seq 集合。
     * (EN) Find seq numbers that dsh-rewind command rows mark as cut. */
    function hiddenSeqsOfChat(chat) {
      const hidden = new Set();
      if (chat === null || typeof chat !== "object") return hidden;
      const order = chat.order;
      const nodes = chat.nodes;
      if (!Array.isArray(order) || nodes === void 0 || typeof nodes.get !== "function") return hidden;
      const spans = [];
      for (const key of order) {
        const node = nodes.get(key);
        if (node === void 0 || node.kind !== "command") continue;
        const command = node.data;
        if (command === null || typeof command !== "object") continue;
        if (command.name !== "rewind") continue;
        if (isRewindPreviewCommand(command)) {
          if (typeof command.seq === "number") hidden.add(command.seq);
          continue;
        }
        if (command.outcome?.kind !== "success") continue;
        const marker = command.outcome.sourceEventSeq;
        if (typeof marker !== "number") continue;
        if (typeof command.seq === "number") hidden.add(command.seq);
        const target = rewindTargetOfCommand(command);
        if (target !== void 0) spans.push({ start: target, end: marker });
      }
      for (const key of order) {
        const node = nodes.get(key);
        if (node === void 0) continue;
        const anchor = typeof node.anchorSeq === "number" ? node.anchorSeq : void 0;
        if (anchor === void 0) continue;
        if (spans.some((span) => anchor >= span.start && anchor <= span.end)) hidden.add(anchor);
        if (node.data?.attributes?.["data-dsh-rewind-hidden"] === true || node.data?.["data-dsh-rewind-hidden"] === true || node.rewindHidden === true) {
          hidden.add(anchor);
        }
      }
      return hidden;
    }

    /** 【中文】过滤掉回退已隐藏的消息。
     * (EN) Drop messages withdrawn by rewind. */
    function filterVisibleMessages(messages, hidden) {
      if (!hidden || hidden.size === 0) return messages;
      return messages.filter((m) => typeof m.seq === "number" && !hidden.has(m.seq));
    }

    /** 【中文】兜底收集器：从已加载的聊天节点枚举用户消息（同时过滤回退隐藏）。
     * (EN) Fallback collector: enumerate user messages from loaded chat nodes. */
    function collectFromNodes(snapshot) {
      const out = [];
      if (snapshot === void 0 || snapshot.chat === void 0) return out;
      const hidden = hiddenSeqsOfChat(snapshot.chat);
      for (const node of snapshot.chat.nodes.values()) {
        if (node === null || typeof node !== "object") continue;
        if (node.kind !== "user") continue;
        if (typeof node.anchorSeq === "number" && hidden.has(node.anchorSeq)) continue;
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

    /** 【中文】让悬浮面板内部平滑滚动至高亮项（若高亮项超出当前面板可视区）。
     * (EN) Smooth-scroll timeline panel internally so the active item is visible. */
    function scrollTimelineItemIntoView(pageEl, itemEl) {
      if (!pageEl || !itemEl) return;
      const pageTop = pageEl.scrollTop;
      const pageBottom = pageTop + pageEl.clientHeight;
      const itemTop = itemEl.offsetTop;
      const itemBottom = itemTop + itemEl.offsetHeight;
      if (itemTop < pageTop) {
        pageEl.scrollTop = Math.max(0, itemTop - 10);
      } else if (itemBottom > pageBottom) {
        pageEl.scrollTop = itemBottom - pageEl.clientHeight + 10;
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

      const hiddenSeqs = hiddenSeqsOfChat(nodeSnapshot?.chat);
      let messages = [];
      let source = "nodes";
      if (Array.isArray(projected?.messages) && projected.messages.length > 0) {
        messages = filterVisibleMessages(
          projected.messages.map(normalize).filter((m) => m !== null),
          hiddenSeqs
        );
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

      // 重点标记状态
      const [marks, setMarks] = react.useState(() => readMarks(sessionId));
      const [marksOnly, setMarksOnly] = react.useState(false);

      // 视口尺寸守卫（窄屏自动隐藏）
      const [isNarrow, setIsNarrow] = react.useState(() => typeof window !== "undefined" && window.innerWidth <= 767);

      // 元素引用
      const pageRef = react.useRef(null);
      const activeItemRef = react.useRef(null);
      // 跳转动画冻结标志（Issue #4 防抽搐乱跳锁）
      const jumpPendingRef = react.useRef(false);

      react.useEffect(() => {
        setMarks(readMarks(sessionId));
        setMarksOnly(false);
      }, [sessionId]);

      const markedSet = new Set(marks);
      const toggleMark = (m) => {
        const k = markKeyOf(m);
        setMarks((prev) => {
          const next = new Set(prev);
          if (next.has(k)) next.delete(k);
          else next.add(k);
          const arr = [...next];
          writeMarks(sessionId, arr);
          return arr;
        });
      };

      // 窄屏监听
      react.useEffect(() => {
        const update = () => setIsNarrow(window.innerWidth <= 767);
        window.addEventListener("resize", update, { passive: true });
        return () => window.removeEventListener("resize", update);
      }, []);

      // 后台加载完整历史
      react.useEffect(() => {
        if (session === void 0 || isNarrow) return;
        setLoadedAll(false);
        if (Array.isArray(projected?.messages) && projected.messages.length > 0) {
          setLoadedAll(true);
          return;
        }
        let cancelled = false;
        const run = async () => {
          let guard = 0;
          while (!cancelled && guard++ < 120) {
            if (Array.isArray(projected?.messages) && projected.messages.length > 0) {
              setLoadedAll(true);
              return;
            }
            const snap = session.getSnapshot();
            if (snap?.hasMore !== true) { setLoadedAll(true); return; }
            if (snap.loadingOlder === true) { await delay(50); continue; }
            await session.loadOlder();
          }
          if (!cancelled) setLoadedAll(true);
        };
        run().catch(() => { if (!cancelled) setLoadedAll(true); });
        return () => { cancelled = true; };
      }, [sessionId, session === void 0 ? "none" : "ready", Array.isArray(projected?.messages) && projected.messages.length > 0 ? "have" : "none", isNarrow]);

      // 跟踪阅读位置（当前高亮的消息项，附带 Issue #4 平滑跳转防抖锁定）
      react.useEffect(() => {
        if (messages.length === 0 || isNarrow) return;
        const messageIndexByKey = new Map();
        for (let i = 0; i < messages.length; i++) {
          const key = anchorKeyOf(messages[i]);
          if (key !== void 0) messageIndexByKey.set(key, i);
        }
        const updateActive = () => {
          // 【Issue #4 修复】：跳转动画进行中直接冻结高亮计算，防止面板乱跳
          if (jumpPendingRef.current) return;
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
        let settleTimer = null;

        const onScroll = () => {
          // 【Issue #4 修复】：检测滚动真正停止（最后一次 scroll 事件 150ms 后）
          if (settleTimer !== null) clearTimeout(settleTimer);
          settleTimer = setTimeout(() => {
            settleTimer = null;
            if (jumpPendingRef.current) {
              jumpPendingRef.current = false;
              updateActive(); // 动画结束只刷新一次最终高亮
            }
          }, 150);

          if (scrollTimer !== null) return;
          scrollTimer = setTimeout(() => {
            scrollTimer = null;
            updateActive();
          }, 60);
        };

        el === null ? void 0 : el.addEventListener("scroll", onScroll, { passive: true });
        const timer = setInterval(updateActive, 2000);
        return () => {
          if (scrollTimer !== null) clearTimeout(scrollTimer);
          if (settleTimer !== null) clearTimeout(settleTimer);
          el === null ? void 0 : el.removeEventListener("scroll", onScroll);
          clearInterval(timer);
        };
      }, [sessionId, messages.length, source, isNarrow]);

      // 保持高亮项在面板内可见
      react.useLayoutEffect(() => {
        if (!show || isNarrow) return;
        const page = pageRef.current;
        const item = activeItemRef.current;
        if (page === null || item === null) return;
        scrollTimelineItemIntoView(page, item);
      }, [activeIndex, messages.length, isNarrow, marksOnly, show]);

      // 动态避让右侧工作台
      react.useEffect(() => {
        if (isNarrow) return;
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
      }, [sessionId, isNarrow]);

      if (sessionId === void 0 || isNarrow || messages.length < 2) return null;

      const activeKey = activeIndex >= 0 && activeIndex < messages.length ? markKeyOf(messages[activeIndex]) : "";
      const displayMessages = marksOnly ? messages.filter((m) => markedSet.has(markKeyOf(m))) : messages;

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
            (0, react_jsx_runtime.jsxs)("div", {
              className: styles.wrap + (messages.length > 8 ? " " + styles.wrapMax : "") + (show ? " " + styles.wrapShow : ""),
              children: [
                (0, react_jsx_runtime.jsx)("div", {
                  className: styles.filter,
                  children: (0, react_jsx_runtime.jsx)("button", {
                    type: "button",
                    className: styles.filterBtn + (marksOnly ? " " + styles.filterOn : ""),
                    "aria-pressed": marksOnly,
                    onClick: () => setMarksOnly((v) => !v),
                    children: t("marksOnly") + (marks.length > 0 ? " (" + marks.length + ")" : "")
                  })
                }),
                (0, react_jsx_runtime.jsx)("div", {
                  className: styles.page,
                  ref: pageRef,
                  children: displayMessages.length === 0
                    ? (0, react_jsx_runtime.jsx)("div", {
                        className: styles.empty,
                        children: t("noMarks")
                      })
                    : displayMessages.map((m) => {
                        const key = anchorKeyOf(m);
                        const mk = markKeyOf(m);
                        const marked = markedSet.has(mk);
                        const isActive = activeKey !== "" && mk === activeKey;
                        return (0, react_jsx_runtime.jsxs)("button", {
                          type: "button",
                          ref: isActive ? activeItemRef : void 0,
                          className: styles.item + (isActive ? " " + styles.itemActive : "") + (marked ? " " + styles.marked : ""),
                          title: (marked ? "★ " : "") + (m.text === "" ? t("noText") : m.text.slice(0, 200)),
                          "aria-label": (marked ? "★ " : "") + t("roleUser") + ": " + (m.text.slice(0, 60) || t("noText")),
                          "aria-current": isActive ? "location" : void 0,
                          onClick: () => {
                            if (key === void 0) return;
                            // 【Issue #4 修复】：跳转置位冻结锁，附带 800ms 兜底超时
                            jumpPendingRef.current = true;
                            window.setTimeout(() => { jumpPendingRef.current = false; }, 800);
                            jumpToMessage(sessionsService, sessionId, key).catch(() => {});
                          },
                          children: [
                            (0, react_jsx_runtime.jsx)("span", {
                              className: styles.title + (show ? " " + styles.titleShow : ""),
                              children: m.text === "" ? t("noText") : m.text
                            }),
                            (0, react_jsx_runtime.jsx)("span", {
                              className: styles.star + (marked ? " " + styles.starOn : ""),
                              role: "button",
                              tabIndex: 0,
                              "aria-pressed": marked,
                              "aria-label": marked ? t("unmark") : t("mark"),
                              onMouseDown: (e) => { e.stopPropagation(); e.preventDefault(); },
                              onClick: (e) => { e.stopPropagation(); toggleMark(m); },
                              onKeyDown: (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleMark(m);
                                }
                              },
                              children: "★"
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
              ]
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
      "noText": "（无文本内容）",
      "marksOnly": "★ 只看标记",
      "mark": "标记为重点",
      "unmark": "取消重点标记",
      "noMarks": "还没有标记的重点"
    };
    // 【中文】英文语言包（可通过 DSH 界面语言设置切换）。
    // (EN) English locale dictionary (switchable via DSH UI language setting).
    const en = {
      "railLabel": "Chat timeline",
      "roleUser": "User",
      "noText": "(no text)",
      "marksOnly": "★ Marked only",
      "mark": "Mark as key point",
      "unmark": "Unmark key point",
      "noMarks": "No marked key points"
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
