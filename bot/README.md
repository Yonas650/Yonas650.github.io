---
title: Yonas Portfolio Chatbot
emoji: "🤖"
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: "4.44.1"
app_file: app.py
pinned: false
---

# Portfolio Chatbot Backend (`/bot`)

This folder is ready to deploy to a **free Hugging Face Space (CPU Basic)** and run independently from your laptop.

## What This Backend Does

- Serves a JSON API with:
  - `POST /chat`
  - `POST /lead`
  - `GET /healthz`
- Loads knowledge from:
  - `me/summary.txt` (canonical summary file)
  - `knowledge/site_text.jsonl` (deterministic export from this repo)
- Runs lightweight retrieval (BM25) and then generates answers with an open model on CPU.
- Rejects low-context/hallucination cases with a safe fallback asking for email follow-up.
- Applies abuse guards:
  - max input chars
  - max history turns
  - max output chars
  - per-session rate limiting
  - deterministic truncation
- Exposes clear error states for frontend handling:
  - warm-up
  - overload
  - timeout

## Folder Structure

- `app.py`: FastAPI server for `/chat` and `/lead`
- `requirements.txt`: Python dependencies for local/HF Space install
- `knowledge/site_text.jsonl`: RAG knowledge export
- `me/summary.txt`: personal summary text (source of truth)
- `scripts/export_knowledge.py`: deterministic export generator

## Create and Deploy a Hugging Face Space

1. Go to <https://huggingface.co/new-space>
2. Create a new Space:
   - Owner: your HF account
   - Space name: e.g. `yonas-portfolio-chatbot`
   - License: your choice
   - SDK: **Gradio** (Python Space)
   - Hardware: **CPU Basic (free)**
3. Upload the contents of `/bot` as the Space root:
   - `app.py`
   - `requirements.txt`
   - `README.md`
   - `knowledge/site_text.jsonl`
   - `me/summary.txt`
   - `scripts/export_knowledge.py` (optional but recommended)
4. Wait for build to finish.
5. Copy your Space URL, for example:
   - `https://your-username-your-space-name.hf.space`

## Hugging Face Variables and Secrets

### Required

- None (backend runs without any secret).

### Optional Variables

- `MODEL_ID`
  - Default if unset: `Qwen/Qwen2.5-1.5B-Instruct`
  - Use this to swap to another CPU-friendly instruct model.

## Local Run

```bash
cd bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/export_knowledge.py
python app.py
```

Server default URL: `http://127.0.0.1:7860`

## Endpoint Tests

### Health

```bash
curl -s http://127.0.0.1:7860/healthz
```

### Chat

```bash
curl -s http://127.0.0.1:7860/chat \
  -H 'Content-Type: application/json' \
  -H 'x-session-id: local-test' \
  -d '{
    "message":"What are Yonas\" research interests?",
    "history":[],
    "page_url":"https://yon.tech/about"
  }'
```

### Lead

```bash
curl -s http://127.0.0.1:7860/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"someone@example.com",
    "name":"Someone",
    "notes":"Interested in collaboration",
    "page_url":"https://yon.tech/contact"
  }'
```

`/lead` writes a single-line JSON log to stdout for each captured lead.

## Regenerate Knowledge Export

From repo root:

```bash
python3 bot/scripts/export_knowledge.py
```

The exporter is deterministic and writes to:

- `bot/knowledge/site_text.jsonl`

### What Gets Indexed

1. Preferred source: exported static HTML in `out/*.html`
2. Fallback source (if no `out/*.html`): source files from `pages/` (excluding `pages/api/`)
3. Plus: `bot/me/summary.txt` as a `Personal Summary` record

Each JSONL row format:

```json
{"url":"/about","title":"About Page","text":"..."}
```

## Error Semantics for Frontend

`POST /chat` can return:

- `503` with `detail.error = "warming_up"`
- `503` with `detail.error = "overloaded"`
- `504` with `detail.error = "timeout"`
- `429` with `detail.error = "rate_limited"`

Frontend should show a warm-up banner for `warming_up/overloaded/timeout` and provide retry.

## Troubleshooting

### Cold Start on Free CPU

- CPU Basic Spaces sleep when idle.
- First request after sleep can take time while model loads.
- Expected frontend behavior: show **"Warming up…"** and retry.

### Slow or Timeout Responses

- 1.5B models on free CPU can be slow.
- Set a smaller `MODEL_ID` if needed.

### Missing Knowledge File

- If startup fails due missing `knowledge/site_text.jsonl`, run:
  - `python3 bot/scripts/export_knowledge.py`
  - then redeploy/upload updated file.

### Rate Limit Responses

- Backend has per-session rate limiting.
- Frontend should back off and retry after ~1 minute if rate-limited.
