"""Temporal Query and Temporal Fact Injection utilities.

Parses temporal anchors from SIL (e.g., "Released March 11, 2026") into
structured date information, computes valid ownership windows, and builds
temporal hints for AML prompts.

Only active when SIL is enabled (MAV or SAV mode). When SIL is disabled,
temporal_anchor is None and all functions gracefully return None/empty.
"""

import random
import re
from datetime import date, timedelta
from typing import Optional


def parse_release_date(temporal_anchor: str) -> Optional[date]:
    """Extract a date from a natural-language temporal anchor string.

    Handles common patterns from SIL consensus answers:
    - "Released March 11, 2026"
    - "Available since October 2024"
    - "Launched on 2025-01-15"
    - "First opened in June 2023"
    - "March 4, 2026"

    Returns:
        A date object if parsing succeeds, None otherwise.
    """
    if not temporal_anchor:
        return None

    text = temporal_anchor.strip()

    # Try ISO format first (YYYY-MM-DD)
    iso_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', text)
    if iso_match:
        try:
            return date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))
        except ValueError:
            pass

    # Month name patterns: "March 11, 2026", "11 March 2026", "March 2026"
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
        "jan": 1, "feb": 2, "mar": 3, "apr": 4,
        "jun": 6, "jul": 7, "aug": 8, "sep": 9, "sept": 9,
        "oct": 10, "nov": 11, "dec": 12,
    }

    # "Month DD, YYYY" or "Month DD YYYY"
    m = re.search(r'([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})', text)
    if m:
        month_str = m.group(1).lower()
        if month_str in months:
            try:
                return date(int(m.group(3)), months[month_str], int(m.group(2)))
            except ValueError:
                pass

    # "DD Month YYYY"
    m = re.search(r'(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', text)
    if m:
        month_str = m.group(2).lower()
        if month_str in months:
            try:
                return date(int(m.group(3)), months[month_str], int(m.group(1)))
            except ValueError:
                pass

    # "Month YYYY" (no day — assume 1st)
    m = re.search(r'([A-Za-z]+)\s+(\d{4})', text)
    if m:
        month_str = m.group(1).lower()
        if month_str in months:
            try:
                return date(int(m.group(2)), months[month_str], 1)
            except ValueError:
                pass

    # "YYYY" alone (assume January 1)
    m = re.search(r'\b(20\d{2})\b', text)
    if m:
        try:
            return date(int(m.group(1)), 1, 1)
        except ValueError:
            pass

    return None


def compute_max_ownership_days(temporal_anchor: Optional[str], current_date: Optional[date] = None) -> Optional[int]:
    """Compute the maximum plausible ownership duration in days.

    Args:
        temporal_anchor: Raw text from SIL temporal query answer.
        current_date: Reference date (defaults to today). Use job creation date for reproducibility.

    Returns:
        Maximum ownership days (>= 1), or None if temporal_anchor is unparseable.
    """
    if not temporal_anchor:
        return None

    release = parse_release_date(temporal_anchor)
    if not release:
        return None

    if current_date is None:
        current_date = date.today()

    delta = (current_date - release).days
    return max(delta, 1)  # At least 1 day (same-day purchase)


def humanize_duration(days: int) -> str:
    """Convert a number of days into natural language.

    Examples:
        1 → "a day"
        5 → "about a week"
        14 → "about two weeks"
        45 → "about a month and a half"
        180 → "about six months"
        400 → "over a year"
    """
    if days <= 1:
        return "a day"
    elif days <= 4:
        return "a few days"
    elif days <= 9:
        return "about a week"
    elif days <= 18:
        return "about two weeks"
    elif days <= 25:
        return "about three weeks"
    elif days <= 45:
        return "about a month"
    elif days <= 75:
        return "about two months"
    elif days <= 105:
        return "about three months"
    elif days <= 150:
        return "about four or five months"
    elif days <= 210:
        return "about six months"
    elif days <= 300:
        return "several months"
    elif days <= 450:
        return "about a year"
    elif days <= 600:
        return "over a year"
    elif days <= 900:
        return "about two years"
    else:
        years = round(days / 365)
        return f"about {years} years"


def sample_ownership_duration(max_days: int) -> str:
    """Sample a random plausible ownership duration and return human-readable text.

    Skews toward more recent purchases (exponential-ish distribution)
    since most reviewers write about recent experiences.

    Args:
        max_days: Maximum ownership duration in days (from compute_max_ownership_days).

    Returns:
        Human-readable string like "about two weeks".
    """
    if max_days <= 1:
        return "a day"

    # Skew toward recent: sample from exponential-ish distribution
    # Most reviews are written within the first 30-60% of the ownership window
    raw = random.random()
    skewed = raw ** 1.5  # Skew toward 0 (recent purchases)
    sampled_days = max(1, int(skewed * max_days))

    return humanize_duration(sampled_days)


def build_temporal_hint(
    temporal_anchor: Optional[str],
    current_date: Optional[date] = None,
) -> str:
    """Build the temporal awareness section for AML prompts.

    Returns an empty string when SIL is disabled (temporal_anchor is None)
    or when the temporal anchor cannot be parsed. This ensures temporal
    facts are ONLY injected when SIL provides them.

    Args:
        temporal_anchor: Raw text from SIL temporal query answer.
        current_date: Reference date (defaults to today).

    Returns:
        Temporal hint section for the AML system prompt, or empty string.
    """
    if not temporal_anchor:
        return ""

    max_days = compute_max_ownership_days(temporal_anchor, current_date)
    if max_days is None:
        return ""

    max_human = humanize_duration(max_days)

    # Build the hint section
    lines = [
        "## Temporal Awareness",
        f"The subject has been available for approximately {max_human} (based on: \"{temporal_anchor.strip()}\").",
        f"- The MAXIMUM time anyone could have owned/used this is {max_human}",
        "- Do NOT claim ownership or experience longer than this (e.g., do not say \"used for years\" if the product is weeks old)",
        "- Early adopters may reference launch-day or first-week experiences",
        "- More recent buyers may reference shorter ownership periods",
        "- Match ownership duration claims to the persona's plausible purchase timing",
    ]
    return "\n".join(lines)


def sample_temporal_fact_for_persona(
    temporal_anchor: Optional[str],
    current_date: Optional[date] = None,
) -> str:
    """Generate a per-persona temporal ownership claim for injection into AML user prompts.

    Returns an empty string when temporal data is unavailable (SIL disabled).

    Args:
        temporal_anchor: Raw text from SIL temporal query answer.
        current_date: Reference date (defaults to today).

    Returns:
        A string like "You have owned/used this for about two weeks." or empty string.
    """
    if not temporal_anchor:
        return ""

    max_days = compute_max_ownership_days(temporal_anchor, current_date)
    if max_days is None:
        return ""

    duration = sample_ownership_duration(max_days)
    return f"You have owned/used this for {duration}."
