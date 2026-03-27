import os

# FORCE Gemini API mode
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "0"

# SET YOUR API KEY HERE
os.environ["GOOGLE_API_KEY"] = "AIzaSyDf4P6ZZAsov42uW9MBu_P8G757_8oMjOg"

"""ADK agent definition for the Personal Assistant.

ADK (Agent Development Kit) discovers an agent by importing this module and
looking for a top-level variable named `root_agent`.

Keep this file intentionally small:
- configure the model
- define clear behavior/instructions
- avoid extra framework code so beginners can follow along
"""

from google.adk.agents.llm_agent import Agent


# The single, top-level agent ADK will run.
root_agent = Agent(
    # Model name as expected by Google ADK / Vertex AI.
    # Your environment must already be authenticated for Vertex AI.
    model="gemini-2.5-flash",
    # A stable name is helpful for logs and debugging.
    name="root_agent",
    # A short description may appear in tooling/UI.
    description="A helpful personal assistant that answers questions clearly and reliably.",
    # Core behavior. Keep it short, explicit, and beginner-friendly.
    instruction="""
You are a helpful and friendly AI assistant.

- Give clear and structured answers
- Use bullet points when helpful
- Keep responses easy to understand
- Be polite and engaging
""",
)
