/**
 * dsh-chat-timeline — host half.
 *
 * Registers the `dshChatTimeline` session projection unit: a complete, durable
 * enumeration of the session's USER-sent messages. The client timeline only
 * needs user turns; assistant replies would double the card count and crowd
 * the rail.
 *
 * Each entry carries: seq (ordering), time, a short preview text, and the
 * durable message id used to reconstruct the chat node's
 * `data-chat-anchor-key` for jumping.
 *
 * Compaction deliberately does NOT drop user messages: dsh renders a
 * compaction marker row at the checkpoint position but keeps the transcript
 * above it intact, so every user-sent message stays visible in the
 * conversation view — and on the timeline.
 *
 * Architecture reference: asukasec/dsh-message-preview (MIT).
 */

const name = "chat-timeline";
const PROJECTION_KEY = "dshChatTimeline";

/** Cap preview text so projection payloads stay small (80 chars ≈ 1-2 lines). */
const MAX_TEXT_CHARS = 80;

/** Join the text blocks of a ContentBlock list (host-side message content). */
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
    // Only DIRECT user-sent messages shape the timeline. Plugin- and
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
    // Compaction does not remove user messages (see header note).
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
  ctx.inject(["sessionProjections"], (projectionCtx) => {
    projectionCtx.sessionProjections.register(messageIndexProjectionDefinition);
  });
}

export { Config, apply, name };
