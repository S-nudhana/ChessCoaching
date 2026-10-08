# Dual-AI Chess Teaching and Board Analysis System

A web-based, single-player chess app pairing two AIs:

1. **Chess-Playing AI** — Stockfish (via `python-chess`), 5 configurable difficulty levels.
2. **Board Analysis AI** — Google Gemini, explains the board before/after each AI move in a
   **Coach** or **Commentator** voice. Every response is checked against facts computed
   independently by `python-chess`/Stockfish before being shown; a failed check regenerates
   once, then falls back to a template built from the verified facts.

See `docs/plan.md` for the full implementation plan.

## Stack

- Backend: FastAPI + python-chess + Stockfish + Gemini API + SQLite
- Frontend: React + TypeScript + shadcn/ui + react-chessboard

## Running locally

Prerequisites: a local Stockfish binary (`brew install stockfish`) and a free Gemini API key.

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in STOCKFISH_PATH and GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000

# frontend
cd frontend
npm install
cp .env.example .env.local   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```
