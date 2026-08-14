/**
 * dsh-chat-timeline — host half（主机侧）。
 *
 * 【中文】注册 "dshChatTimeline" 会话投影单元：对会话中用户发送的消息做
 * 完整、持久的枚举。客户端时间线只需要用户消息；若把助手回复也加进来，
 * 卡片数量会翻倍、挤满侧栏。
 *
 * (EN) Registers the `dshChatTimeline` session projection unit: a complete,
 * durable enumeration of the session's USER-sent messages. The client timeline
 * only needs user turns; assistant replies would double the card count and
 * crowd the rail.
 *
 * 【中文】每条记录携带：seq（排序）、time（时间）、短预览文本，以及用于
 * 重建聊天节点 data-chat-anchor-key 以便跳转的持久消息 id。
 *
 * (EN) Each entry carries: seq (ordering), time, a short preview text, and the
 * durable message id used to reconstruct the chat node's
 * `data-chat-anchor-key` for jumping.
 *
 * 【中文】压缩（compaction）刻意不丢弃用户消息：dsh 在检查点位置渲染压缩
 * 标记行，但保留其上方完整对话记录——因此每条用户消息在对话视图中（以及
 * 时间线上）始终可见。
 *
 * (EN) Compaction deliberately does NOT drop user messages: dsh renders a
 * compaction marker row at the checkpoint position but keeps the transcript
 * above it intact, so every user-sent message stays visible in the
 * conversation view — and on the timeline.
 *
 * 架构参考 (Architecture reference): asukasec/dsh-message-preview (MIT)。
 */

const name = "chat-timeline";
const PROJECTION_KEY = "dshChatTimeline";

/**
 * 【中文】限制预览文本长度，让投影负载保持小巧（80 字符 ≈ 1-2 行）。
 * (EN) Cap preview text so projection payloads stay small (80 chars ≈ 1-2 lines).
 */
const MAX_TEXT_CHARS = 80;

/**
 * 【中文】拼接 ContentBlock 列表中的文本块（主机侧消息内容）。
 * (EN) Join the text blocks of a ContentBlock list (host-side message content).
 */
function textOf(content) {
  if (!Array.isArray(content)) return "";
  let out = "";
  for (const block of content) {
    if (block !== null && typeof block === "object" && block.type === "text" && typeof block.text === "string") out += block.text;
  }
  return out.trim().slice(0, MAX_TEXT_CHARS);
}

const MessageIndexSchema = {
  parse: (val) => val
};

const messageIndexProjectionDefinition = {
  key: PROJECTION_KEY,
  schema: MessageIndexSchema,
  init: () => ({ messages: [] }),
  apply: (state, event) => {
    // 【中文】只有用户直接发送的消息才会塑造时间线。插件注入与工具注入的
    // 上下文虽然也走 user/message 事件，但它们的 source.kind 不同（任务完成
    // 通知、工具提示、定时提醒、agent.inject 上下文……）——它们是对话里的
    // 上下文行，不是用户发出的消息，因此这里与聊天视图的节点组装器一样，
    // 把它们排除在外。
    //
    // (EN) Only DIRECT user-sent messages shape the timeline. Plugin- and
    // tool-injected context rides the same `user/message` event type with a
    // different `source.kind` (job completions, tool notices, cron
    // notifications, agent.inject context...) — those are context rows in the
    // conversation, not turns the user sent, so they are excluded here exactly
    // as the chat view's node assembler classifies them.
    if (event.type === "user/message") {
      const data = event.data;
      if (data.source === null || typeof data.source !== "object" || data.source.kind !== "user") return state;
      const text = textOf(data.content);
      const entry = { seq: event.seq, time: event.time, text, ...(typeof data.id === "string" ? { id: data.id } : {}) };
      return { messages: [...state.messages, entry] };
    }
    // 【中文】压缩不会移除用户消息（见文件头部说明）。
    // (EN) Compaction does not remove user messages (see header note).
    return state;
  },
  view: (state) => state,
  stateVersion: 4
};

const Config = {
  "~standard": {
    version: 1,
    vendor: "chat-timeline",
    validate: (value) => ({ value: value ?? {} })
  }
};

function apply(ctx) {
  // 【中文】向会话投影系统注册本插件的投影定义。
  // (EN) Register this plugin's projection definition with the session projection system.
  ctx.inject(["sessionProjections"], (projectionCtx) => {
    projectionCtx.sessionProjections.register(messageIndexProjectionDefinition);
  });
}

export { Config, apply, name };
