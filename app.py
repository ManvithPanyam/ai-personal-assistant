"""FastAPI wrapper around the existing Google ADK agent.

This turns the lab-style ADK agent into a tiny web app:
- Serves a simple HTML chat UI (templates + static files)
- Exposes POST /chat for the browser to send user messages

Keep it beginner-friendly and minimal: one file backend, no frameworks on frontend.
"""

from __future__ import annotations

import uuid
import os
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

# Google ADK runner/session utilities for invoking an agent in-process.
from google.adk.runners import InMemoryRunner

# ADK runners in this version use google-genai types for messages.
from google.genai.types import Content, Part

# Import your existing agent (do not rewrite it).
# Note: this repo uses a nested package layout:
#   personal_assistant/ (project folder)
#     personal_assistant/ (python package)
from personal_assistant.personal_assistant.agent import root_agent


logger = logging.getLogger("personal_assistant")


def _configure_environment() -> None:
    """Configure runtime env vars without requiring local env files.

    Hosting platforms typically set environment variables directly.
    For local runs, you can also export the vars in your shell.
    """

    # The google-genai SDK commonly reads `GOOGLE_API_KEY`.
    # This project documents `GEMINI_API_KEY` for clarity.
    if os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]


_configure_environment()


app = FastAPI(title="Personal Assistant", version="1.0.0")

# Serve static assets (CSS/JS) under /static
app.mount("/static", StaticFiles(directory="static"), name="static")

# HTML templates live in /templates
templates = Jinja2Templates(directory="templates")


# --- ADK wiring (created once at startup) ---
# In-memory sessions keep conversation context as long as the server is running.
# For a demo product, this is perfect. For real persistence, you'd swap this.
#
# Note: In the installed google-adk version, InMemoryRunner already constructs
# its own InMemorySessionService internally.
_runner = InMemoryRunner(agent=root_agent, app_name="personal_assistant")


class ChatRequest(BaseModel):
    """Request body for POST /chat."""

    message: str
    # Optional: the browser can send a session id to keep context.
    session_id: str | None = None


class ChatResponse(BaseModel):
    """Response body for POST /chat."""

    response: str
    session_id: str


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> Any:
    """Serve the chat UI."""

    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    """Send the user's message to the ADK agent and return the agent response."""

    text = (payload.message or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # If the client didn't provide a session id, create one.
    # This allows multi-turn chats without requiring user accounts.
    session_id = payload.session_id or str(uuid.uuid4())

    try:
        # We use a single demo user id. For real apps, you'd have auth.
        user_id = "web"

        # Ensure a session exists. Some ADK versions require pre-creating it.
        session_service = _runner.session_service
        session = await session_service.get_session(
            app_name="personal_assistant", user_id=user_id, session_id=session_id
        )
        if not session:
            await session_service.create_session(
                app_name="personal_assistant", user_id=user_id, session_id=session_id
            )
            session = await session_service.get_session(
                app_name="personal_assistant", user_id=user_id, session_id=session_id
            )

        # ADK expects a content-like object for the new user message.
        # The runner will call the configured Gemini model through Vertex AI.
        new_message = Content(role="user", parts=[Part(text=text)])

        # In this ADK version, run_async returns an *async generator* of events.
        events = []
        async for event in _runner.run_async(user_id=user_id, session_id=session_id, new_message=new_message):
            events.append(event)

        response_text = _extract_last_text_from_events(events) or "(No response generated)"

        return ChatResponse(response=response_text, session_id=session_id)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Agent call failed")

        message = str(exc)
        if "No API key was provided" in message or "API key" in message:
            message = (
                "Model authentication is not configured. "
                "Set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in your environment. "
                f"Original error: {exc}"
            )

        raise HTTPException(status_code=500, detail=f"Agent call failed: {message}") from exc


def _extract_last_text_from_events(events: list[Any]) -> str | None:
    """Extract the last text response from ADK events.

    ADK returns a sequence of events (tool calls, model messages, etc.).
    For a simple chat UI, we usually want the latest assistant text.

    This function is intentionally defensive because event shapes can vary
    slightly between ADK versions.
    """

    for event in reversed(events):
        content = getattr(event, "content", None)
        if not content:
            continue

        # content.parts is commonly a list of objects/dicts that may include text.
        parts = getattr(content, "parts", None)
        if not parts:
            continue

        for part in parts:
            # Handle both dict-like and object-like parts.
            if isinstance(part, dict):
                text = part.get("text")
            else:
                text = getattr(part, "text", None)

            if isinstance(text, str) and text.strip():
                return text.strip()

    return None
