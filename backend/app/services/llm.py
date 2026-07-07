"""
LLM service — generates answers using Groq's free API.

HOW IT WORKS:
- Sends the question + relevant context chunks to Groq's LLM
- The system prompt instructs the LLM to answer ONLY from provided context
- The LLM generates an answer and cites which sources it used

WHY Groq:
- Free tier (no credit card needed)
- Uses llama-3.1-8b-instant — fast and capable
- ~6000 tokens/minute on free tier
- Inference is extremely fast (uses custom LPU hardware)

THE PROMPT DESIGN:
- System prompt: "You are a helpful assistant. Answer ONLY from the provided context."
- User prompt: Context chunks + the question
- This prevents the LLM from making up information (hallucination)
"""

import logging
from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level Groq client
_client: Groq | None = None


def init_llm() -> None:
    """Initialize the Groq client. Called at app startup."""
    global _client

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — LLM features will not work")
        return

    _client = Groq(api_key=settings.groq_api_key)
    logger.info("Groq LLM client initialized (model=%s)", settings.llm_model)


def generate_answer(question: str, context_chunks: list[dict]) -> str:
    """
    Generate an answer to a question using context chunks.

    Args:
        question: The user's question
        context_chunks: List of relevant chunks from vector search
                       Each dict has: content, item_id, source_type, score

    Returns:
        The LLM-generated answer string

    Raises:
        RuntimeError: If Groq client is not initialized
    """
    if _client is None:
        raise RuntimeError(
            "LLM client not initialized. "
            "Make sure GROQ_API_KEY is set in your .env file."
        )

    # Build the context section for the prompt
    context_text = _build_context(context_chunks)

    # System prompt — tells the LLM how to behave
    system_prompt = (
        "You are a helpful knowledge assistant. "
        "Answer the user's question based ONLY on the provided context. "
        "If the context doesn't contain enough information to answer, say so clearly. "
        "When referencing information, cite the source by mentioning [Source X] "
        "where X is the source number. "
        "Be concise and direct."
    )

    # User prompt — the actual question with context
    user_prompt = f"""Context (retrieved from saved content):

{context_text}

Question: {question}

Instructions: Answer the question using ONLY the context above. Cite sources using [Source 1], [Source 2], etc."""

    logger.info("Sending query to Groq LLM: '%s' with %d context chunks", question[:50], len(context_chunks))

    try:
        response = _client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,  # Low temperature = more factual, less creative
            max_tokens=1024,
        )

        answer = response.choices[0].message.content
        logger.info("LLM generated answer (%d chars)", len(answer))
        return answer

    except Exception as e:
        logger.error("LLM generation failed: %s", str(e))
        raise RuntimeError(f"Failed to generate answer: {str(e)}")


def _build_context(chunks: list[dict]) -> str:
    """
    Format context chunks into a numbered list for the LLM prompt.

    Example output:
        [Source 1] (note): Python is a programming language...
        [Source 2] (url): According to the article...
    """
    if not chunks:
        return "No relevant context found."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        source_label = f"[Source {i}] ({chunk['source_type']})"
        parts.append(f"{source_label}: {chunk['content']}")

    return "\n\n".join(parts)
