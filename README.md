# Personal Assistant AI Web App

A clean, recruiter-ready AI chat web app: a lightweight FastAPI backend wired to a Google ADK agent that answers with structured, friendly responses using Gemini.

This repo is intentionally small and readable (no frontend frameworks, no complex backend layers) while still being “production-shaped”: clear configuration, minimal secrets risk, and a polished UI.

## Features
- Fast, simple chat UI (no React)
- Clear user vs assistant message layout
- “Typing…” loading indicator + auto-scroll
- Session persistence in the browser for multi-turn context
- Structured assistant responses (headings/bullets when useful)

## How It Works
UI (HTML/CSS/JS) → FastAPI (`POST /chat`) → Google ADK Agent → Gemini → response

## Tech Stack
- Python
- FastAPI + Uvicorn
- Google ADK (Agent Development Kit)
- Gemini (via Google GenAI)
- Jinja2 templates
- Vanilla HTML/CSS/JS

## Live Demo
https://ai-personal-assistant-9ybs.onrender.com

## Example Interaction
**User:** Create a 30-minute study plan for learning Python lists.

**Assistant:**
- **Goal:** Understand list basics + common operations
- **Plan (30 minutes):**
  1. (5 min) Review list syntax + indexing
  2. (10 min) Practice add/remove: `append`, `extend`, `pop`, `remove`
  3. (10 min) Slicing + iteration
  4. (5 min) Quick quiz + next steps

## Run Locally
1. Install dependencies:
	- `pip install -r requirements.txt`
2. Set environment variable:
	- `GEMINI_API_KEY` (see below)
3. Start the server:
	- `uvicorn app:app --reload`
4. Open:
	- `http://127.0.0.1:8000`

## Environment Setup
- `GEMINI_API_KEY` — your Gemini API key.

Notes:
- The underlying SDK also supports `GOOGLE_API_KEY`. If you set `GEMINI_API_KEY`, the app maps it automatically.

## Future Improvements
- Add streaming responses (token-by-token) for faster perceived latency
- Add message rendering for Markdown (code blocks, lists) with a small sanitizer
- Add basic rate limiting and request IDs for better observability
- Add optional server-side session storage (Redis / DB) for long-lived history