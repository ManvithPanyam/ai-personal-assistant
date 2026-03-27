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

function getSessionId() {
  return window.localStorage.getItem(SESSION_KEY);
}

function setSessionId(id) {
  window.localStorage.setItem(SESSION_KEY, id);
}

function scrollToBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addMessage({ role, text, meta }) {
  const row = document.createElement("div");
  row.className = role === "user" ? "row row--user" : "row row--assistant";

  const bubble = document.createElement("div");
  bubble.className = role === "user" ? "bubble bubble--user" : "bubble bubble--assistant";
  bubble.textContent = text;

  row.appendChild(bubble);

  if (meta) {
    const metaEl = document.createElement("div");
    metaEl.className = "meta";
    metaEl.textContent = meta;

    const wrap = document.createElement("div");
    wrap.appendChild(row);
    wrap.appendChild(metaEl);

    chatEl.appendChild(wrap);
  } else {
    chatEl.appendChild(row);
  }

  scrollToBottom();
  return bubble;
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "row row--assistant";

  const bubble = document.createElement("div");
  bubble.className = "bubble bubble--assistant";

  const typing = document.createElement("span");
  typing.className = "typing";
  typing.innerHTML =
    '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

  bubble.appendChild(typing);
  row.appendChild(bubble);
  chatEl.appendChild(row);
  scrollToBottom();

  return { row, bubble };
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
  text: "Hi! I’m your Personal Assistant. What can I help you with today?",
  meta: nowLabel(),
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = (inputEl.value || "").trim();
  if (!text) return;

  inputEl.value = "";
  addMessage({ role: "user", text, meta: nowLabel() });

  setBusy(true);
  const typing = addTypingIndicator();

  try {
    const reply = await sendMessage(text);
    typing.row.remove();
    addMessage({ role: "assistant", text: reply, meta: nowLabel() });
  } catch (err) {
    typing.row.remove();
    addMessage({
      role: "assistant",
      text: `Sorry — something went wrong.\n\n${err.message}`,
      meta: nowLabel(),
    });
  } finally {
    setBusy(false);
    inputEl.focus();
  }
});

// Autofocus the input for a smoother demo experience.
inputEl.focus();
