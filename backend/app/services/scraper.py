"""
URL scraping service — extracts main content from web pages.

HOW IT WORKS:
- Takes a URL, downloads the page, extracts the main article text
- Uses 'trafilatura' which is specifically designed for article extraction
- Falls back to basic HTML stripping if trafilatura fails

WHY trafilatura:
- Best free library for article extraction (used in NLP research)
- Handles boilerplate removal (navbars, footers, ads)
- Works on most news sites, blogs, and documentation pages
- No API key needed
"""

import logging
import httpx
import trafilatura

logger = logging.getLogger(__name__)

# Timeout for fetching URLs (10 seconds)
REQUEST_TIMEOUT = 10.0


def extract_content_from_url(url: str) -> str:
    """
    Fetch a URL and extract its main text content.

    Args:
        url: The URL to scrape

    Returns:
        Extracted text content

    Raises:
        ValueError: If the URL is invalid or content can't be extracted
        ConnectionError: If the URL can't be reached
    """
    logger.info("Fetching content from URL: %s", url)

    # Validate URL format
    if not url.startswith(("http://", "https://")):
        raise ValueError(f"Invalid URL format: {url}. Must start with http:// or https://")

    try:
        # Fetch the page
        response = httpx.get(
            url,
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; KnowledgeInbox/1.0)"
            },
        )
        response.raise_for_status()

    except httpx.TimeoutException:
        logger.error("Timeout fetching URL: %s", url)
        raise ConnectionError(f"Timeout fetching URL: {url}")
    except httpx.HTTPStatusError as e:
        logger.error("HTTP error %d for URL: %s", e.response.status_code, url)
        raise ConnectionError(f"HTTP error {e.response.status_code} for URL: {url}")
    except httpx.RequestError as e:
        logger.error("Failed to fetch URL: %s — %s", url, str(e))
        raise ConnectionError(f"Failed to fetch URL: {url}")

    # Extract main content using trafilatura
    html = response.text
    extracted = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=True,
        no_fallback=False,  # Use fallback extraction if main method fails
    )

    if not extracted or len(extracted.strip()) < 50:
        logger.warning("Could not extract meaningful content from %s", url)
        raise ValueError(
            f"Could not extract meaningful content from {url}. "
            "The page might be JavaScript-heavy or behind authentication."
        )

    logger.info("Extracted %d characters from %s", len(extracted), url)
    return extracted
