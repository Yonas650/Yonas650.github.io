import json
import logging
import os
import re
import threading
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from dataclasses import dataclass
from pathlib import Path
from typing import Deque, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from rank_bm25 import BM25Okapi
from transformers import AutoModelForCausalLM, AutoTokenizer

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("portfolio-bot")

BASE_DIR = Path(__file__).resolve().parent
SUMMARY_PATH = BASE_DIR / "me" / "summary.txt"
KNOWLEDGE_PATH = BASE_DIR / "knowledge" / "site_text.jsonl"

MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")

MAX_INPUT_CHARS = int(os.getenv("MAX_INPUT_CHARS", "1800"))
MAX_HISTORY_TURNS = int(os.getenv("MAX_HISTORY_TURNS", "14"))
MAX_HISTORY_MESSAGE_CHARS = int(os.getenv("MAX_HISTORY_MESSAGE_CHARS", "800"))
MAX_OUTPUT_CHARS = int(os.getenv("MAX_OUTPUT_CHARS", "1400"))
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "220"))
MAX_RATE_LIMIT_PER_MINUTE = int(os.getenv("MAX_RATE_LIMIT_PER_MINUTE", "10"))
GENERATION_TIMEOUT_SECONDS = int(os.getenv("GENERATION_TIMEOUT_SECONDS", "60"))
TOP_K = int(os.getenv("TOP_K", "5"))
MIN_TOP_SCORE = float(os.getenv("MIN_TOP_SCORE", "0.6"))

CHUNK_WORDS = int(os.getenv("CHUNK_WORDS", "170"))
CHUNK_OVERLAP_WORDS = int(os.getenv("CHUNK_OVERLAP_WORDS", "45"))

HISTORY_STORAGE_WINDOW_SECONDS = 60
REQUEST_HEADER_SESSION = "x-session-id"

CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
TOKEN_RE = re.compile(r"[a-z0-9]+")
EMAIL_RE = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,63}$"
)

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "you",
    "your",
}

REFUSAL_MESSAGE = (
    "I don\u2019t know based on the current site content. "
    "If you\u2019d like, share your email and I can follow up."
)

SYSTEM_PROMPT = (
    "You are the assistant for Yonas Atinafu's portfolio website. "
    "Only answer using the provided context snippets. "
    "Do not invent facts, projects, dates, or links that are not in context. "
    "If context is insufficient, reply exactly with the fallback sentence provided in instructions. "
    "Keep responses concise, helpful, and professional."
)


class HistoryMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="message content")


class ChatRequest(BaseModel):
    message: str
    history: List[HistoryMessage] = Field(default_factory=list)
    page_url: Optional[str] = None


class SourceItem(BaseModel):
    title: str
    url: str


class ChatResponse(BaseModel):
    reply: str
    sources: List[SourceItem]


class LeadRequest(BaseModel):
    email: str
    name: Optional[str] = None
    notes: Optional[str] = None
    page_url: Optional[str] = None


class LeadResponse(BaseModel):
    ok: bool


@dataclass
class Chunk:
    title: str
    url: str
    text: str
    tokens: List[str]


class ChatError(Exception):
    def __init__(self, status_code: int, error: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.error = error
        self.message = message


class SessionRateLimiter:
    def __init__(self, max_per_window: int, window_seconds: int):
        self.max_per_window = max_per_window
        self.window_seconds = window_seconds
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> Tuple[bool, int]:
        now = time.time()
        with self._lock:
            queue = self._hits[key]
            while queue and now - queue[0] > self.window_seconds:
                queue.popleft()
            if len(queue) >= self.max_per_window:
                retry_after = int(self.window_seconds - (now - queue[0])) + 1
                return False, max(retry_after, 1)
            queue.append(now)
            return True, 0


class KnowledgeStore:
    def __init__(self, chunks: List[Chunk]):
        self.chunks = chunks
        self.bm25 = BM25Okapi([chunk.tokens for chunk in chunks])

    @staticmethod
    def _chunk_text(text: str) -> List[str]:
        words = text.split()
        if not words:
            return []
        chunks = []
        stride = max(1, CHUNK_WORDS - CHUNK_OVERLAP_WORDS)
        for start in range(0, len(words), stride):
            end = min(start + CHUNK_WORDS, len(words))
            part = " ".join(words[start:end]).strip()
            if part:
                chunks.append(part)
            if end >= len(words):
                break
        return chunks

    @classmethod
    def load(cls, summary_path: Path, knowledge_path: Path) -> "KnowledgeStore":
        docs: List[Tuple[str, str, str]] = []

        summary_text = ""
        if summary_path.exists():
            summary_text = normalize_text(summary_path.read_text(encoding="utf-8"), 16000)
        if summary_text:
            docs.append(("Personal Summary", "/about", summary_text))

        if not knowledge_path.exists():
            raise RuntimeError(
                f"Knowledge file not found at {knowledge_path}. Run the export script first."
            )

        with knowledge_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    logger.warning("Skipping invalid JSONL line")
                    continue
                url = normalize_text(str(payload.get("url", "")), 300)
                title = normalize_text(str(payload.get("title", "Untitled")), 300)
                text = normalize_text(str(payload.get("text", "")), 20000)
                if url == "/404":
                    continue
                if text:
                    docs.append((title or "Untitled", url or "/", text))

        chunks: List[Chunk] = []
        for title, url, text in docs:
            for part in cls._chunk_text(text):
                tokens = tokenize(part)
                if not tokens:
                    continue
                chunks.append(Chunk(title=title, url=url, text=part, tokens=tokens))

        if not chunks:
            raise RuntimeError("No valid chunks available after loading knowledge base")

        logger.info("Knowledge loaded: %s chunks", len(chunks))
        return cls(chunks)

    def retrieve(self, query: str, page_url: Optional[str], top_k: int) -> List[Tuple[Chunk, float]]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        scores = self.bm25.get_scores(query_tokens)
        normalized_page = normalize_page_path(page_url)
        if normalized_page:
            for idx, chunk in enumerate(self.chunks):
                chunk_path = normalize_page_path(chunk.url)
                if chunk_path == normalized_page:
                    scores[idx] = scores[idx] * 1.45 + 0.8
                elif chunk_path and normalized_page in chunk_path:
                    scores[idx] = scores[idx] * 1.1

        ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        results: List[Tuple[Chunk, float]] = []
        for idx in ranked_indices[: max(top_k * 3, top_k)]:
            score = float(scores[idx])
            if score <= 0:
                continue
            results.append((self.chunks[idx], score))
            if len(results) >= top_k:
                break
        return results


class ModelRuntime:
    def __init__(self, model_id: str):
        self.model_id = model_id
        self._tokenizer = None
        self._model = None
        self._loading = False
        self._load_error = ""
        self._lock = threading.Lock()
        self._infer_lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=1)

    def ensure_loaded_async(self) -> str:
        with self._lock:
            if self._model is not None and self._tokenizer is not None:
                return "ready"
            if self._loading:
                return "loading"
            self._loading = True
            thread = threading.Thread(target=self._load_worker, daemon=True)
            thread.start()
            return "loading"

    def _load_worker(self) -> None:
        logger.info("Loading model %s on CPU", self.model_id)
        try:
            tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
            model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                low_cpu_mem_usage=True,
                torch_dtype=torch.float32,
            )
            model.eval()
            with self._lock:
                self._tokenizer = tokenizer
                self._model = model
                self._load_error = ""
            logger.info("Model loaded")
        except Exception as exc:
            logger.exception("Model load failed")
            with self._lock:
                self._load_error = str(exc)
        finally:
            with self._lock:
                self._loading = False

    def status(self) -> str:
        with self._lock:
            if self._model is not None and self._tokenizer is not None:
                return "ready"
            if self._loading:
                return "loading"
            if self._load_error:
                return "error"
            return "idle"

    def error(self) -> str:
        with self._lock:
            return self._load_error

    def _snapshot(self):
        with self._lock:
            return self._tokenizer, self._model

    def generate(self, messages: List[Dict[str, str]]) -> str:
        tokenizer, model = self._snapshot()
        if tokenizer is None or model is None:
            raise ChatError(
                status_code=503,
                error="warming_up",
                message="Model is warming up. Please retry in a few seconds.",
            )

        if not self._infer_lock.acquire(blocking=False):
            raise ChatError(
                status_code=503,
                error="overloaded",
                message="Server is busy with another request. Please retry shortly.",
            )

        try:
            future = self._executor.submit(self._generate_blocking, tokenizer, model, messages)
            try:
                return future.result(timeout=GENERATION_TIMEOUT_SECONDS)
            except FutureTimeoutError as exc:
                future.cancel()
                raise ChatError(
                    status_code=504,
                    error="timeout",
                    message="Generation timed out. Please retry.",
                ) from exc
        finally:
            self._infer_lock.release()

    @staticmethod
    def _generate_blocking(tokenizer, model, messages: List[Dict[str, str]]) -> str:
        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
        model_inputs = tokenizer(prompt, return_tensors="pt")

        with torch.no_grad():
            generated = model.generate(
                **model_inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                do_sample=False,
                temperature=0.0,
                top_p=1.0,
                eos_token_id=tokenizer.eos_token_id,
                pad_token_id=tokenizer.eos_token_id,
            )

        new_tokens = generated[0][model_inputs["input_ids"].shape[1] :]
        text = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        return text


def normalize_text(value: str, max_chars: int) -> str:
    clean = CONTROL_CHARS_RE.sub(" ", value or "")
    clean = re.sub(r"\s+", " ", clean).strip()
    if len(clean) <= max_chars:
        return clean
    return clean[: max_chars - 3].rstrip() + "..."


def tokenize(text: str) -> List[str]:
    return [tok for tok in TOKEN_RE.findall(text.lower()) if tok not in STOPWORDS]


def normalize_page_path(value: Optional[str]) -> str:
    if not value:
        return ""
    parsed = urlparse(value)
    path = parsed.path if parsed.scheme or parsed.netloc else value
    path = path.strip() or "/"
    if not path.startswith("/"):
        path = f"/{path}"
    if len(path) > 1 and path.endswith("/"):
        path = path[:-1]
    return path


def trimmed_history(history: List[HistoryMessage]) -> List[HistoryMessage]:
    valid: List[HistoryMessage] = []
    for item in history:
        role = (item.role or "").strip().lower()
        if role not in {"user", "assistant"}:
            continue
        content = normalize_text(item.content or "", MAX_HISTORY_MESSAGE_CHARS)
        if not content:
            continue
        valid.append(HistoryMessage(role=role, content=content))

    if len(valid) <= MAX_HISTORY_TURNS * 2:
        return valid
    return valid[-MAX_HISTORY_TURNS * 2 :]


def build_sources(retrieved: List[Tuple[Chunk, float]]) -> List[SourceItem]:
    seen = set()
    sources: List[SourceItem] = []
    for chunk, _ in retrieved:
        key = (chunk.title, chunk.url)
        if key in seen:
            continue
        seen.add(key)
        sources.append(SourceItem(title=chunk.title, url=chunk.url))
        if len(sources) >= 4:
            break
    return sources


def has_sufficient_context(retrieved: List[Tuple[Chunk, float]]) -> bool:
    if not retrieved:
        return False
    top_score = retrieved[0][1]
    if top_score >= MIN_TOP_SCORE:
        return True
    positives = [score for _, score in retrieved if score > 0]
    return len(positives) >= 2 and sum(positives[:2]) >= MIN_TOP_SCORE * 1.4


def serialize_history_for_prompt(history: List[HistoryMessage]) -> str:
    if not history:
        return "(no previous turns)"
    rows = []
    for item in history[-8:]:
        role = "User" if item.role == "user" else "Assistant"
        rows.append(f"{role}: {item.content}")
    return "\n".join(rows)


def build_prompt_messages(
    user_message: str,
    history: List[HistoryMessage],
    page_url: Optional[str],
    retrieved: List[Tuple[Chunk, float]],
) -> List[Dict[str, str]]:
    snippets = []
    for idx, (chunk, _) in enumerate(retrieved, start=1):
        snippets.append(
            f"[{idx}] title={chunk.title} url={chunk.url}\n{chunk.text}"
        )

    context_block = "\n\n".join(snippets)
    instruction_block = (
        "Fallback sentence if context is insufficient: "
        f"{REFUSAL_MESSAGE}"
    )

    user_block = (
        f"Current page URL: {page_url or '(not provided)'}\n\n"
        f"Recent conversation:\n{serialize_history_for_prompt(history)}\n\n"
        f"Retrieved context:\n{context_block}\n\n"
        f"User question: {user_message}\n\n"
        f"{instruction_block}"
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_block},
    ]


def extract_session_id(request: Request) -> str:
    supplied = (request.headers.get(REQUEST_HEADER_SESSION) or "").strip()
    supplied = re.sub(r"[^a-zA-Z0-9_-]", "", supplied)[:64]
    if supplied:
        return supplied
    client_host = request.client.host if request.client else "anonymous"
    return normalize_text(client_host, 64) or "anonymous"


def log_lead_to_stdout(
    email: str, name: str, notes: str, page_url: str
) -> None:
    line = {
        "event": "lead_captured",
        "email": email,
        "name": name or None,
        "notes": notes or None,
        "page_url": page_url or None,
        "ts": int(time.time()),
    }
    print(json.dumps(line, ensure_ascii=False, separators=(",", ":")), flush=True)


def validate_email(email: str) -> str:
    clean = normalize_text(email, 254)
    if not EMAIL_RE.match(clean):
        raise ChatError(status_code=400, error="invalid_email", message="Invalid email address")
    return clean


knowledge_store = KnowledgeStore.load(SUMMARY_PATH, KNOWLEDGE_PATH)
model_runtime = ModelRuntime(MODEL_ID)
rate_limiter = SessionRateLimiter(MAX_RATE_LIMIT_PER_MINUTE, HISTORY_STORAGE_WINDOW_SECONDS)

app = FastAPI(title="Yonas Portfolio Chatbot API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    # Warm model in the background so first chat can return quickly after startup.
    model_runtime.ensure_loaded_async()


@app.get("/")
def root() -> Dict[str, str]:
    return {
        "ok": "true",
        "service": "yonas-portfolio-chatbot",
        "model": MODEL_ID,
        "model_status": model_runtime.status(),
    }


@app.get("/healthz")
def healthz() -> Dict[str, str]:
    return {
        "status": "ok",
        "model_status": model_runtime.status(),
    }


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    try:
        message = normalize_text(payload.message or "", MAX_INPUT_CHARS)
        if not message:
            raise ChatError(status_code=400, error="invalid_message", message="Message is empty")

        history = trimmed_history(payload.history)
        page_url = normalize_text(payload.page_url or "", 300) if payload.page_url else None

        session_id = extract_session_id(request)
        allowed, retry_after = rate_limiter.allow(session_id)
        if not allowed:
            raise ChatError(
                status_code=429,
                error="rate_limited",
                message=f"Too many requests for this session. Retry in {retry_after}s.",
            )

        combined_query_parts = [message]
        for item in history[-4:]:
            if item.role == "user":
                combined_query_parts.append(item.content)
        combined_query = " ".join(combined_query_parts)

        retrieved = knowledge_store.retrieve(combined_query, page_url, TOP_K)
        sources = build_sources(retrieved)

        model_status = model_runtime.status()
        if model_status in {"idle", "loading"}:
            model_runtime.ensure_loaded_async()
            raise ChatError(
                status_code=503,
                error="warming_up",
                message="Model is warming up. Please retry in a few seconds.",
            )
        if model_status == "error":
            raise ChatError(
                status_code=503,
                error="overloaded",
                message=(
                    "Model failed to load or is currently unavailable. "
                    f"Details: {model_runtime.error() or 'unknown'}"
                ),
            )

        if not has_sufficient_context(retrieved):
            return ChatResponse(reply=REFUSAL_MESSAGE, sources=sources)

        prompt_messages = build_prompt_messages(message, history, page_url, retrieved)
        raw_reply = model_runtime.generate(prompt_messages)
        reply = normalize_text(raw_reply, MAX_OUTPUT_CHARS)

        if not reply or "I don't know" in reply.lower() or "i do not know" in reply.lower():
            reply = REFUSAL_MESSAGE

        return ChatResponse(reply=reply, sources=sources)

    except ChatError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"error": exc.error, "message": exc.message},
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected chat failure")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_error",
                "message": "Unexpected server error. Please retry.",
            },
        ) from exc


@app.post("/lead", response_model=LeadResponse)
def lead(payload: LeadRequest) -> LeadResponse:
    try:
        email = validate_email(payload.email)
        name = normalize_text(payload.name or "", 120) if payload.name else ""
        notes = normalize_text(payload.notes or "", 1200) if payload.notes else ""
        page_url = normalize_text(payload.page_url or "", 300) if payload.page_url else ""

        log_lead_to_stdout(email=email, name=name, notes=notes, page_url=page_url)
        return LeadResponse(ok=True)

    except ChatError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"error": exc.error, "message": exc.message},
        ) from exc
    except Exception as exc:
        logger.exception("Lead capture failed")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_error",
                "message": "Unable to capture lead at the moment.",
            },
        ) from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "7860"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
