# Dual-AI Chess Teaching and Board Analysis System — Implementation Plan

## Context

This builds the senior project described in `Nudhana_Proposal_revised.docx` (KMUTT CS Senior Project Proposal, Nudhana Sarutipaisan & Prechaya Maksap, advisor Jonathan Hoyin Chan): a web-based, single-player chess app pairing two specialized AIs —

1. A **Chess-Playing AI** (Stockfish, via `python-chess`) that selects moves at 5+ configurable difficulty levels.
2. A **Board Analysis AI** (Google Gemini API, free tier) that explains the board state before/after each AI move in a chosen **Coach** or **Commentator** voice.

The project's core technical differentiator — and main risk called out in the proposal — is that LLMs hallucinate (misread positions, invent pieces, miscount material). So every Gemini response must be checked against facts computed independently by `python-chess` + Stockfish *before* being shown; a failed check triggers one regeneration, then falls back to a template built directly from the verified facts (never silently shows unverified text).

This plan covers **Scopes 1–5 only** (Chess-Playing AI, Board Analysis AI, web interface, accuracy-checking pipeline, API rate-limit handling) — Scope 6 (accuracy benchmarking, pilot user study tooling) is intentionally excluded; the team will plan that separately once the app is working.

**Confirmed stack** (decided with the user, matches what's named in the approved proposal): FastAPI backend, React + TypeScript + shadcn/ui frontend, SQLite for game state and commentary caching, Gemini as the sole/primary LLM provider (kept as named in the proposal rather than substituted, to avoid deviating from what the advisor already approved), Stockfish via `python-chess`'s UCI interface. Working directory is currently empty — this is a greenfield build with nothing existing to reconcile against.

---

## Step 0 — UI wireframe (before writing React code)

Build a quick static HTML/CSS preview of the layout (board + commentary panel + difficulty/style controls, styled in the shadcn aesthetic) to sanity-check the visual layout before implementing real components. Throwaway/reference only — not part of the shipped app.

---

## 1. Project Structure

Two-folder repo (no shared build tooling needed between Python/Node):

```
ChessCoaching/
├── .gitignore
├── README.md
├── backend/
│   ├── .env                          # gitignored
│   ├── .env.example                  # committed template
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                   # FastAPI app factory, CORS, router mounting, lifespan (Stockfish shutdown)
│   │   ├── config.py                 # pydantic Settings: STOCKFISH_PATH, GEMINI_API_KEY, DATABASE_PATH
│   │   ├── db.py                     # sqlite3 connection + schema init
│   │   ├── models.py                 # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── game.py               # /game/* endpoints
│   │   │   └── settings.py           # /difficulty-levels
│   │   ├── engine/
│   │   │   ├── stockfish_pool.py     # engine lifecycle, run_in_executor wrapper, asyncio.Lock
│   │   │   └── difficulty.py         # difficulty 1-5 -> Skill Level / UCI_Elo mapping
│   │   ├── analysis/
│   │   │   ├── facts.py              # verified-facts computation (python-chess + Stockfish)
│   │   │   ├── gemini_client.py      # prompt templates + Gemini call wrapper
│   │   │   ├── validator.py          # response validation against verified facts
│   │   │   └── template_fallback.py  # no-LLM template commentary generator
│   │   └── cache/
│   │       └── commentary_cache.py   # SQLite-backed cache get/set by FEN+style+phase
│   └── tests/
│       ├── test_facts.py
│       ├── test_validator.py
│       ├── test_stockfish_pool.py
│       └── test_routes.py
└── frontend/
    ├── .env.local                    # gitignored (VITE_API_BASE_URL)
    ├── .env.example
    ├── package.json
    ├── tailwind.config.ts
    ├── components.json               # shadcn/ui config
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── lib/
        │   ├── api.ts                 # fetch wrapper for backend calls
        │   └── sessionId.ts           # browser-tab session id (crypto.randomUUID, sessionStorage)
        ├── context/
        │   └── GameContext.tsx        # React Context + reducer for game state
        ├── types/game.ts              # TS types mirroring backend Pydantic models
        ├── components/
        │   ├── ui/                    # shadcn-generated primitives
        │   ├── BoardPanel.tsx         # wraps react-chessboard
        │   ├── CommentaryPanel.tsx    # shadcn Card + Badge (source: gemini/template/cache)
        │   ├── DifficultySelector.tsx # shadcn Select
        │   ├── StyleToggle.tsx        # shadcn ToggleGroup (Coach/Commentator)
        │   ├── NewGameDialog.tsx      # shadcn Dialog
        │   ├── MoveHistory.tsx        # shadcn Table/ScrollArea
        │   └── GameControls.tsx       # shadcn Button group (resign, explain-my-move)
        └── styles/globals.css         # Tailwind + shadcn CSS variables
```

**Secrets** — `backend/.env` (gitignored): `STOCKFISH_PATH`, `GEMINI_API_KEY`, `DATABASE_PATH`, `GEMINI_MODEL`, `CORS_ORIGINS`. Loaded via a `pydantic_settings.BaseSettings` subclass in `config.py`. `.env.example` committed with placeholders. `frontend/.env.local` holds `VITE_API_BASE_URL`.

No auth/accounts: frontend generates a `session_id` (UUID v4) on first load, stored in `sessionStorage`, sent as `X-Session-Id` header on every request — this is how the backend finds "the player's" in-progress game.

---

## 2. Backend Design

### SQLite schema (`backend/app/db.py`)

- **`games`**: `game_id` (PK), `session_id`, `fen`, `pgn`, `player_color`, `difficulty`, `commentary_style`, `status` (`in_progress|checkmate|stalemate|draw|resigned`), `created_at`, `updated_at`.
- **`moves`**: `move_id` (PK autoincrement), `game_id` (FK), `ply`, `mover` (`player|ai`), `uci`, `san`, `fen_before`, `fen_after`, `eval_cp`, `eval_mate`, `created_at`.
- **`commentary_cache`**: `cache_key` (PK, `sha256(fen|style|phase)`), `fen`, `commentary_style`, `phase` (`before|after`), `source` (`gemini|template`), `text`, `verified_facts_json`, `created_at`.

Indexes on `moves(game_id, ply)` and `games(session_id, status)`.

### FastAPI endpoints (`backend/app/routers/game.py`, `settings.py`)

- `POST /game/new` — creates a game row, returns starting FEN (+ AI's opening move if player chose black).
- `GET /game/{game_id}` — restores full state (used on page refresh).
- `POST /game/move` — the core turn handler: validate player move via `python-chess` (server-authoritative) → apply + persist → if not game-over, get Stockfish's reply (`run_in_executor`) → apply + persist → compute verified facts before/after → **one combined Gemini call** covering both → validate → regenerate once → template fallback → cache → return `MoveTurnResponse` (player move, AI move, before/after commentary, game status).
- `POST /game/resign`
- `POST /game/commentary/own-move` — lazy, on-demand only, for the player's own moves (never auto-generated).
- `PATCH /game/style` — switch Coach/Commentator mid-game.
- `GET /difficulty-levels` — static table of the 5 levels.

### Stockfish integration (`backend/app/engine/stockfish_pool.py`)

`chess.engine.SimpleEngine`'s UCI I/O is blocking, so it's wrapped: a persistent `SimpleEngine` instance guarded by an `asyncio.Lock`, all calls routed through `loop.run_in_executor`. Methods: `get_ai_move(fen, skill_level, uci_elo, think_time)`, `evaluate(fen, depth)`, `shutdown()` (called from FastAPI's `lifespan`). Single-player means serializing engine access via the lock is not a bottleneck.

Difficulty mapping (`engine/difficulty.py`) — 5 levels from Skill Level 0/Elo 800 ("Beginner") up to Skill Level 20/no Elo cap ("Expert"), using both Stockfish's `Skill Level` knob and `UCI_LimitStrength`/`UCI_Elo` so low levels genuinely play like a beginner rather than a weakened-but-still-sharp engine.

### Board Analysis module (`backend/app/analysis/`)

- **`facts.py`** — computes `VerifiedFacts`: material count per side (standard point values), material diff, full piece list with squares, check status + checking pieces, attacked/undefended pieces, legal move count, Stockfish eval (centipawns or mate-in-N), Stockfish's suggested best move. This is the ground truth everything else is checked against.
- **`gemini_client.py`** — builds one prompt per AI move containing the full verified-facts block for *both* before and after positions, instructs Gemini to respond as JSON `{"before": "...", "after": "..."}`, explicitly tells it to only reference listed facts and say when unsure. Separate system framing for Coach vs Commentator style. Calls `genai.GenerativeModel(...).generate_content_async(...)` with JSON response mode.
- **`validator.py`** — regex-checks any stated material numbers against the real counts, checks every mentioned square actually has a piece on it per verified facts, checks "White/Black is better" claims don't contradict the Stockfish eval sign.
- **`template_fallback.py`** — builds commentary directly from `VerifiedFacts` with no LLM call (material phrase + eval phrase + check/attacked-piece counts).
- Control flow: cache lookup → if miss, call Gemini → validate → on failure, regenerate once → on second failure (or any rate-limit/quota error), use template fallback. Commentary failures are caught independently of the move-processing path, so Gemini being down never blocks or 500s a move.

### Caching (`backend/app/cache/commentary_cache.py`)

Cache key = `sha256(fen|style|phase)`. Lookup happens before any Gemini call — repeated positions (openings, transpositions) never re-invoke the API. Switching Coach/Commentator mid-game naturally busts the cache for that position since style is part of the key.

### Rate-limit handling

`google.generativeai` raises `ResourceExhausted` (HTTP 429) on quota errors — caught and routed straight to the template fallback (no wasted regenerate attempt), with a `rate_limited: true` flag on the response so the frontend can show a one-time toast without disabling gameplay.

---

## 3. Frontend Design

### shadcn/ui setup

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npx shadcn@latest add button select toggle-group card dialog table scroll-area badge skeleton sonner separator label
```

shadcn components are copied into `src/components/ui/` by the CLI (not a traditional npm runtime dependency) — `lucide-react` (icons), `class-variance-authority`, `clsx`, `tailwind-merge` are added automatically as its runtime deps.

### Component breakdown

| Component | shadcn components used | Responsibility |
|---|---|---|
| `App` | `Toaster` (sonner) | Layout shell, wraps `GameProvider` |
| `BoardPanel` | `Card`, `Skeleton` | Hosts `react-chessboard`, shows "AI thinking" overlay |
| `CommentaryPanel` | `Card`, `Badge`, `Skeleton` | Before/after commentary text; `Badge` color flags `gemini` vs `template` source |
| `DifficultySelector` | `Select`, `Label` | 5 difficulty levels from `/difficulty-levels` |
| `StyleToggle` | `ToggleGroup` | Coach / Commentator |
| `NewGameDialog` | `Dialog`, `Button` | Choose color, difficulty, style to start |
| `GameControls` | `Button`, `Separator` | Resign, "Explain my last move" (lazy commentary) |
| `MoveHistory` | `ScrollArea`, `Table` | Ply-numbered SAN move list |

### State management

React Context + `useReducer` (`GameContext.tsx`) — sufficient for one game, no cross-cutting app state; no Redux/Zustand needed.

### Move flow

Client-side `chess.js` (pairs naturally with `react-chessboard`) pre-filters legal drag targets for responsive UX only — the server (`python-chess`) is always the authority; an illegal move server-side returns 400 and the frontend reverts its optimistic update. `POST /game/move` returns the player's move, AI's move, and both before/after commentary in **one combined response** — so the board shows the player's move immediately with a thinking overlay, and the commentary panel shows a skeleton until that single response resolves (~2-4s typical: sub-second Stockfish + 1-3s Gemini). The "Explain my last move" button triggers its own independent request/loading state, not blocking the rest of the UI.

---

## 4. Key Dependencies

**Backend**: `fastapi`, `uvicorn[standard]`, `python-chess`, `google-generativeai`, `pydantic`, `pydantic-settings`, `python-dotenv`, `httpx`, `pytest`, `pytest-asyncio`.

**Frontend**: `react-chessboard`, `chess.js`, `tailwindcss`/`postcss`/`autoprefixer` (dev), shadcn's auto-added runtime deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`), `sonner`. Native `fetch` wrapped in `lib/api.ts` — no `axios` needed at this scale.

---

## 5. Build/Run Instructions

Prerequisites: Stockfish binary installed locally (`brew install stockfish`), a free Gemini API key from Google AI Studio.

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

---

## 6. Verification Plan

1. **Smoke test**: `curl http://localhost:8000/difficulty-levels` returns 5 entries; Stockfish spawns successfully (log line on first engine use).
2. **Full game through the UI**: start a game via `NewGameDialog`, play to checkmate/draw via drag-and-drop; confirm board, move history, and commentary panel all update each turn.
3. **Legal-move enforcement**: illegal drags snap back client-side; a raw illegal UCI string posted directly to `/game/move` returns 400 and doesn't corrupt stored state.
4. **Special rules**: castling (both sides), en passant, and promotion (including underpromotion) all behave correctly end-to-end.
5. **Accuracy-check fallback**: force `validate_commentary` to always fail (test-only flag) and confirm the regenerate-once-then-template flow produces a `source="template"` result, cached correctly.
6. **Difficulty actually changes strength**: compare Stockfish's resolved UCI config (`Skill Level`/`UCI_Elo`) at level 1 vs level 5 and confirm qualitatively weaker play at level 1 over a few games.
7. **Caching avoids duplicate Gemini calls**: replay an identical FEN twice and confirm the second hit returns `source="cache"` with no additional Gemini call logged.
8. **Rate-limit handling**: mock a `ResourceExhausted` error and confirm the response still returns 200 with `source="template"` and `rate_limited: true`, gameplay unaffected.
9. **Refresh survives**: mid-game browser refresh restores exact state via `GET /game/{game_id}` using the `session_id` in `sessionStorage`.

### Critical files to implement first
- `backend/app/engine/stockfish_pool.py`
- `backend/app/analysis/facts.py`
- `backend/app/analysis/validator.py`
- `backend/app/routers/game.py`
- `frontend/src/context/GameContext.tsx`
- `frontend/components.json` (shadcn setup)
