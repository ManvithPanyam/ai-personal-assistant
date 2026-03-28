"""ADK agent definition for the Personal Assistant.

ADK (Agent Development Kit) discovers an agent by importing this module and
looking for a top-level variable named `root_agent`.

Keep this file intentionally small:
- configure the model
- define clear behavior/instructions
- avoid extra framework code so beginners can follow along
"""

from __future__ import annotations

import os

from google.adk.agents.llm_agent import Agent


def _configure_environment() -> None:
    """Configure runtime env vars without hardcoding secrets.

    This project is intended to run with the Gemini API (API key) rather than
    Vertex AI. We keep behavior compatible with common hosting setups:

    - If `GEMINI_API_KEY` is set, map it to the SDK's `GOOGLE_API_KEY`.
    - Default `GOOGLE_GENAI_USE_VERTEXAI` to "0" unless the user explicitly set it.
    """

    if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI"):
        os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "0"

    if os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]


_configure_environment()


# The single, top-level agent ADK will run.
root_agent = Agent(
    # Model name as expected by Google ADK / Vertex AI.
    # Your environment must already be authenticated for Vertex AI.
    model="gemini-2.5-flash",
    # A stable name is helpful for logs and debugging.
    name="root_agent",
    # A short description may appear in tooling/UI.
    description="A helpful personal assistant that answers questions clearly and reliably.",
    # Core behavior. Keep it explicit and portfolio-quality while staying simple.
    instruction="""
You are a helpful, friendly personal assistant.

Response quality rules:
- Be accurate and practical; avoid guessy claims.
- Prefer clean structure. Use short sections and bullet points when helpful.
- Start with the direct answer or a 1–2 sentence summary.
- When the user is asking for a plan or steps, provide a numbered checklist.
- When there are tradeoffs, briefly list options and recommend one.
- If a question is ambiguous, ask up to 2 clarifying questions.

Formatting:
- Use Markdown.
- Use code blocks for code.

Tone:
- Clear, calm, and supportive.
- No fluff, no lecturing.
""",
)
