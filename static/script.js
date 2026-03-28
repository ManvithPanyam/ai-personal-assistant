// Simple Chat UI logic (no frameworks).
// - Renders user/assistant bubbles
// - Calls POST /chat
// - Shows a loading indicator while waiting
// - Keeps a session_id in the browser so conversation context persists

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendButton");

// Persist session id across reloads in this browser.
const SESSION_KEY = "pa_session_id";

function configureMarkdown() {
  // marked is loaded from CDN in index.html.
  // If it isn't available for any reason, we fall back to plain text.
  if (!window.marked) return;

  // Avoid noisy IDs/emails munging and keep output predictable.
  window.marked.setOptions({ headerIds: false, mangle: false });

  // Minimal hardening: prevent javascript: links.
  const renderer = new window.marked.Renderer();
  renderer.link = (href, title, text) => {
    const safeHref = typeof href === "string" ? href.trim() : "";
    const isRelative = safeHref.startsWith("/") || safeHref.startsWith("#") || safeHref.startsWith("./");
    const isHttp = safeHref.startsWith("http://") || safeHref.startsWith("https://") || safeHref.startsWith("mailto:");

    const finalHref = isRelative || isHttp ? safeHref : "#";
    const t = title ? ` title="${title.replace(/"/g, "&quot;")}"` : "";
    return `<a href="${finalHref}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  window.marked.use({ renderer });
}

configureMarkdown();

function getSessionId() {
  return window.localStorage.getItem(SESSION_KEY);
}

function setSessionId(id) {
  window.localStorage.setItem(SESSION_KEY, id);
}

function scrollToBottom() {
  // Keep the latest message visible.
  try {
    chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: "smooth" });
  } catch {
    chatEl.scrollTop = chatEl.scrollHeight;
  }
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setBubbleContent(bubbleEl, role, text) {
  const isAssistant = role !== "user";

  if (isAssistant && window.marked) {
    // Escape HTML first to avoid raw HTML injection.
    const safeSource = escapeHtml(text);
    bubbleEl.innerHTML = window.marked.parse(safeSource);
    return;
  }

  bubbleEl.textContent = text;
}

function addMessage({ role, text, meta }) {
  const isUser = role === "user";

  const message = document.createElement("div");
  message.className = isUser ? "message message--user" : "message message--assistant";

  const bubble = document.createElement("div");
  bubble.className = isUser ? "bubble bubble--user" : "bubble bubble--assistant";
  setBubbleContent(bubble, role, text);

  message.appendChild(bubble);

  if (meta) {
    const metaEl = document.createElement("div");
    metaEl.className = isUser ? "meta meta--user" : "meta meta--assistant";
    metaEl.textContent = meta;
    message.appendChild(metaEl);
  }

  chatEl.appendChild(message);
  scrollToBottom();
  return bubble;
}

function addTypingMessage() {
  // Lightweight loading indicator: add a real assistant message and replace its contents.
  const bubble = addMessage({ role: "assistant", text: "Typing…", meta: nowLabel() });

  const typing = document.createElement("span");
  typing.className = "typing";
  typing.setAttribute("aria-label", "Assistant is typing");
  typing.innerHTML =
    '<span class="typing__label">Typing…</span><span class="dot"></span><span class="dot"></span><span class="dot"></span>';

  bubble.textContent = "";
  bubble.appendChild(typing);
  scrollToBottom();

  return bubble;
}

async function sendMessage(message) {
  const session_id = getSessionId();

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id }),
  });

  if (!res.ok) {
    // Try to extract a useful error message.
    let detail = "Request failed";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const data = await res.json();
  if (data.session_id) setSessionId(data.session_id);
  return data.response;
}

function setBusy(isBusy) {
  sendBtn.disabled = isBusy;
  inputEl.disabled = isBusy;
}

// Seed the chat with a friendly first message.
addMessage({
  role: "assistant",
  text: "Hi! I’m your AI Assistant. What can I help you with today?",
  meta: nowLabel(),
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = (inputEl.value || "").trim();
  if (!text) return;

  inputEl.value = "";
  addMessage({ role: "user", text, meta: nowLabel() });

  setBusy(true);
  const typingBubble = addTypingMessage();

  try {
    const reply = await sendMessage(text);
    // Replace the typing indicator with the actual response (Markdown-rendered).
    setBubbleContent(typingBubble, "assistant", reply);
    const metaEl = typingBubble.parentElement?.querySelector?.(".meta");
    if (metaEl) metaEl.textContent = nowLabel();
    scrollToBottom();
  } catch (err) {
    setBubbleContent(
      typingBubble,
      "assistant",
      `Sorry — something went wrong.\n\n${err.message}`
    );
    const metaEl = typingBubble.parentElement?.querySelector?.(".meta");
    if (metaEl) metaEl.textContent = nowLabel();
    scrollToBottom();
  } finally {
    setBusy(false);
    inputEl.focus();
  }
});

// Autofocus the input for a smoother demo experience.
inputEl.focus();
