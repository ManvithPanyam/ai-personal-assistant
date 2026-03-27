# Personal Assistant — Google ADK Agent (Gemini 2.5 Flash on Vertex AI)

## Overview
**Personal Assistant** is a minimal, production-minded AI agent built with **Google ADK (Agent Development Kit)** and **Gemini 2.5 Flash** via **Vertex AI**. It’s designed to deliver **clear, structured answers** for everyday questions—quickly and reliably—while keeping the codebase intentionally small and easy to understand.

This project showcases how to package a clean, runnable ADK agent that’s ready to extend into more specialized assistants (study helper, planner, support bot, etc.).

## Features
- **Structured responses**: concise answers with bullets/headings when helpful
- **Practical help**: explanations, summaries, drafting, and “how-to” guidance
- **Minimal, readable code**: one agent definition (`root_agent`) with a polished instruction
- **Vertex AI powered**: uses Gemini 2.5 Flash for fast, high-quality outputs
- **CLI-first workflow**: runs cleanly via the ADK terminal interface

## How It Works (High Level)
- The project defines a single ADK agent called **`root_agent`** in `personal_assistant/agent.py`.
- When you run the agent, ADK loads the package and uses the configured **Gemini 2.5 Flash** model.
- A short, professional instruction prompt guides the assistant to respond with **helpful, clear, and well-structured** outputs.

## Tech Stack
- **Python**
- **Google ADK (Agent Development Kit)**
- **Vertex AI**
- **Gemini 2.5 Flash**

## Example Usage
Use it for everyday assistance and clean, structured outputs:

- “Summarize this topic in 5 bullets and a short conclusion.”
- “Draft a professional email to reschedule a meeting.”
- “Explain recursion like I’m new to programming, with a tiny example.”
- “Give me a 30-minute study plan for today based on these goals: …”

## Run Locally (Web UI)
- Install dependencies: `pip install -r requirements.txt`
- Start the server: `uvicorn app:app --reload`
- Open: `http://127.0.0.1:8000`

If you see an authentication error, make sure your environment is authenticated for Vertex AI (ADC) and has access to the Gemini model you configured.

## Minimal Setup
This repo intentionally avoids committing secrets (no `.env`). Run it in an environment that already has Google Cloud / Vertex AI authentication configured.

- Install dependencies: `pip install -r requirements.txt`
- Run the agent: `adk run personal_assistant`

> Note: In some environments (e.g., Cloud Shell), the ADK web UI may be unreliable due to authentication constraints. The **CLI run flow** is the primary supported way to use this project.

## Optional Improvements (Not Implemented)
Ideas to extend this into a stronger multi-skill assistant:

- **Study mode**: quizzes, flashcards, concept checks, spaced repetition prompts
- **Planner mode**: daily agenda, prioritization, time-blocking suggestions
- **Writing helper**: tone rewrites, resume bullet refinement, cover-letter drafts
- **Tool use** (if/when your track covers it): small utilities like calculators, date helpers, or structured task workflows