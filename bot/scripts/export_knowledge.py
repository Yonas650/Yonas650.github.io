#!/usr/bin/env python3
"""Deterministically export portfolio knowledge into JSONL for RAG."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[2]
BOT_DIR = ROOT / "bot"
OUTPUT_PATH = BOT_DIR / "knowledge" / "site_text.jsonl"
SUMMARY_PATH = BOT_DIR / "me" / "summary.txt"
OUT_DIR = ROOT / "out"
PAGES_DIR = ROOT / "pages"

MAX_TEXT_CHARS = 32000

SCRIPT_STYLE_NOSCRIPT_RE = re.compile(
    r"<(script|style|noscript)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL
)
TAG_RE = re.compile(r"<[^>]+>")
TITLE_RE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
MAIN_RE = re.compile(r"<main\b[^>]*>(.*?)</main>", re.IGNORECASE | re.DOTALL)
BODY_RE = re.compile(r"<body\b[^>]*>(.*?)</body>", re.IGNORECASE | re.DOTALL)
WHITESPACE_RE = re.compile(r"\s+")


def normalize_text(value: str, max_chars: int = MAX_TEXT_CHARS) -> str:
    value = value.replace("\x00", " ")
    value = WHITESPACE_RE.sub(" ", value).strip()
    if len(value) <= max_chars:
        return value
    return value[: max_chars - 3].rstrip() + "..."


def route_from_html_path(path: Path) -> str:
    stem = path.stem
    if stem == "index":
        return "/"
    if stem == "404":
        return "/404"
    return f"/{stem}"


def extract_visible_text(raw_html: str) -> Tuple[str, str]:
    title_match = TITLE_RE.search(raw_html)
    title = html.unescape(title_match.group(1)) if title_match else "Untitled"

    content_match = MAIN_RE.search(raw_html) or BODY_RE.search(raw_html)
    content = content_match.group(1) if content_match else raw_html

    content = SCRIPT_STYLE_NOSCRIPT_RE.sub(" ", content)
    content = TAG_RE.sub(" ", content)
    text = html.unescape(content)
    text = normalize_text(text)

    title = normalize_text(title, 300)
    return title or "Untitled", text


def source_from_exported_html() -> List[Dict[str, str]]:
    if not OUT_DIR.exists():
        return []

    rows: List[Dict[str, str]] = []
    for html_file in sorted(OUT_DIR.glob("*.html")):
        if html_file.name.startswith("_"):
            continue
        raw_html = html_file.read_text(encoding="utf-8", errors="ignore")
        title, text = extract_visible_text(raw_html)
        if not text:
            continue
        rows.append(
            {
                "url": route_from_html_path(html_file),
                "title": title,
                "text": text,
            }
        )
    return rows


def source_from_pages_fallback() -> List[Dict[str, str]]:
    if not PAGES_DIR.exists():
        return []

    rows: List[Dict[str, str]] = []
    for source_file in sorted(PAGES_DIR.rglob("*")):
        if source_file.is_dir():
            continue
        if "pages/api" in str(source_file):
            continue
        if source_file.suffix.lower() not in {".jsx", ".js", ".md", ".mdx"}:
            continue

        raw = source_file.read_text(encoding="utf-8", errors="ignore")
        if not raw.strip():
            continue

        path = source_file.relative_to(PAGES_DIR)
        route = "/" + str(path.with_suffix("")).replace("\\", "/")
        route = route.replace("/index", "/")
        route = route.replace("//", "/")
        if route != "/" and route.endswith("/"):
            route = route[:-1]

        title = f"Source: {path.name}"
        text = normalize_text(raw)
        rows.append({"url": route, "title": title, "text": text})
    return rows


def summary_row() -> List[Dict[str, str]]:
    if not SUMMARY_PATH.exists():
        return []
    summary = normalize_text(SUMMARY_PATH.read_text(encoding="utf-8", errors="ignore"), 20000)
    if not summary:
        return []
    return [{"url": "/about", "title": "Personal Summary", "text": summary}]


def deduplicate_rows(rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    seen = set()
    unique: List[Dict[str, str]] = []
    for row in rows:
        key = (row["url"], row["title"], row["text"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)
    return unique


def export_knowledge() -> int:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    rows = source_from_exported_html()
    source_kind = "out/*.html"

    if not rows:
        rows = source_from_pages_fallback()
        source_kind = "pages/* fallback"

    rows = summary_row() + rows
    rows = deduplicate_rows(rows)

    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Exported {len(rows)} rows to {OUTPUT_PATH}")
    print(f"Source mode: {source_kind} + summary.txt")
    return 0


if __name__ == "__main__":
    raise SystemExit(export_knowledge())
