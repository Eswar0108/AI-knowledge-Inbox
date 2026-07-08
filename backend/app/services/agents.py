"""
Multi-Agent service module — implements intent routing, local RAG retrieval,
live web search, and final response synthesis.

AGENTS DEFINED:
1. RouterAgent: Classifies user question into LOCAL, WEB, or DIRECT.
2. RAGRetrieverAgent: Fetches relevant chunks from ChromaDB.
3. WebResearcherAgent: Performs live web search using a clean HTML scraper on DuckDuckGo.
4. WriterAgent: Combines findings and generates a cited synthesis.
"""

import logging
import re
from html.parser import HTMLParser
from typing import Any
import httpx

from app.config import settings
from app.services import embedder, vector_store, llm

logger = logging.getLogger(__name__)


# --- 1. DuckDuckGo HTML Scraper Parser ---

class DDGHTMLParser(HTMLParser):
    """Parses non-JS DuckDuckGo HTML search results page."""
    def __init__(self):
        super().__init__()
        self.results = []
        self.current_result = {}
        self.in_snippet = False
        self.in_title = False
        self.temp_text = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        # result__a is the class for search result title links
        if tag == "a" and attrs_dict.get("class") == "result__a":
            self.in_title = True
            self.current_result = {"url": attrs_dict.get("href", "")}
        # result__snippet is the class for result descriptions
        elif tag == "a" and attrs_dict.get("class") == "result__snippet":
            self.in_snippet = True
            self.temp_text = []

    def handle_endtag(self, tag):
        if tag == "a" and self.in_title:
            self.in_title = False
            self.current_result["title"] = "".join(self.temp_text).strip()
            self.temp_text = []
        elif tag == "a" and self.in_snippet:
            self.in_snippet = False
            self.current_result["snippet"] = "".join(self.temp_text).strip()
            # Save complete result
            if self.current_result.get("url") and self.current_result.get("snippet"):
                self.results.append(self.current_result)
            self.current_result = {}
            self.temp_text = []

    def handle_data(self, data):
        if self.in_title or self.in_snippet:
            self.temp_text.append(data)


# --- 2. Agents Implementations ---

class RouterAgent:
    """Classifies user queries to optimize the retrieval strategy."""
    
    @staticmethod
    def route(question: str) -> str:
        """
        Classifies user question.
        Returns: 'LOCAL', 'WEB', or 'DIRECT'
        """
        system_prompt = (
            "You are a routing agent for a knowledge base. "
            "Classify the user's question into one of three categories:\n"
            "- LOCAL: The question is about retrieving specific saved notes, articles, "
            "personal bookmarks, or items in their knowledge base.\n"
            "- WEB: The question asks about general programming topics, news, weather, "
            "current events, or information not typically found in a personal notebook.\n"
            "- DIRECT: The question is a simple greeting (e.g., 'hi', 'hello'), conversational banter, "
            "or a generic request that requires no external lookup.\n\n"
            "Respond with ONLY one word: LOCAL, WEB, or DIRECT. Do not write anything else."
        )

        logger.info("RouterAgent analyzing query intent: '%s'", question[:50])

        try:
            # We reuse the llm client init pattern from llm service
            client = llm._client
            if client is None:
                logger.warning("LLM client not ready. Defaulting route to LOCAL")
                return "LOCAL"

            response = client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
                temperature=0.0,  # Strict categorization
                max_tokens=10,
            )

            decision = response.choices[0].message.content.strip().upper()
            
            # Clean decision text from any stray markdown or punctuation
            decision = re.sub(r'[^A-Z]', '', decision)

            if decision in ["LOCAL", "WEB", "DIRECT"]:
                logger.info("RouterAgent selected route: %s", decision)
                return decision
            
            logger.warning("RouterAgent returned invalid route '%s'. Defaulting to LOCAL", decision)
            return "LOCAL"

        except Exception as e:
            logger.error("RouterAgent failed: %s. Defaulting to LOCAL", str(e))
            return "LOCAL"


class WebResearcherAgent:
    """Performs live web queries and extracts summarized text snippets."""

    @staticmethod
    def research(query: str) -> list[dict]:
        """
        Search DuckDuckGo HTML and return top results.
        Returns: list of dicts with keys: content, url, title
        """
        logger.info("WebResearcherAgent searching the web for: '%s'", query[:50])
        
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        }
        url = f"https://html.duckduckgo.com/html/?q={httpx.URLEscape(query) if hasattr(httpx, 'URLEscape') else query}"
        
        try:
            with httpx.Client(follow_redirects=True, timeout=8.0) as client:
                r = client.get(url, headers=headers)
                r.raise_for_status()

            parser = DDGHTMLParser()
            parser.feed(r.text)
            
            logger.info("WebResearcherAgent found %d search results", len(parser.results))
            return parser.results[:3]  # Return top 3 findings

        except Exception as e:
            logger.error("WebResearcherAgent search failed: %s", str(e))
            return []


class RAGRetrieverAgent:
    """Queries local vector database for matching snippets."""

    @staticmethod
    def retrieve(question: str) -> list[dict]:
        """Query local ChromaDB store."""
        logger.info("RAGRetrieverAgent searching local database...")
        query_embedding = embedder.get_single_embedding(question)
        return vector_store.search(query_embedding)


class WriterAgent:
    """Synthesizes text summaries from local/web context logs."""

    @staticmethod
    def synthesize(question: str, context_chunks: list[dict], mode: str) -> str:
        """Generate final response with cited evidence."""
        if not context_chunks:
            return "I couldn't find enough information to answer your question."

        # Format context references
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            source_info = f"[Source {i}] ({chunk.get('source_type', 'web')}): {chunk.get('content', '')}"
            context_parts.append(source_info)
        context_text = "\n\n".join(context_parts)

        # Context type label
        context_label = "local bookmarks/notes" if mode == "LOCAL" else "live search results"

        system_prompt = (
            "You are a precise synthesis writer. "
            f"Answer the user's question based ONLY on the provided context (retrieved from {context_label}).\n"
            "If the context does not contain enough information to answer, state this clearly.\n"
            "Cite your sources using [Source 1], [Source 2], etc. where appropriate.\n"
            "Keep the answer concise and direct."
        )

        user_prompt = f"""Context:
{context_text}

Question: {question}

Instructions: Answer using the context above. Cite using [Source 1], [Source 2], etc."""

        logger.info("WriterAgent generating synthesis using %s mode", mode)

        try:
            client = llm._client
            if client is None:
                raise RuntimeError("LLM client not ready.")

            response = client.chat.completions.create(
                model=settings.llm_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=1024,
            )
            return response.choices[0].message.content

        except Exception as e:
            logger.error("WriterAgent synthesis failed: %s", str(e))
            raise RuntimeError(f"WriterAgent failed: {str(e)}")
