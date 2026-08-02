# Advanced RAG — Lecture Transcript Q&A System

A full-stack Retrieval-Augmented Generation (RAG) system that lets you upload course content (lecture transcripts, subtitles, PDFs, slides, and more) and ask natural-language questions about it. Every answer is grounded in your uploaded material, with inline citations pointing to the exact module, lecture, and timestamp the information came from.

Built for course creators, students, and anyone who wants precise, cited answers from their own documents instead of a general-purpose chatbot.

---

## ✨ Features

- **Multi-format ingestion** — `.srt`, `.vtt`, `.pdf`, `.docx`, `.pptx`, `.csv`, `.txt`
- **Folder-aware upload** — drop an entire course folder and the system auto-detects module numbers from folder names (e.g. `module-1`), with a manual override for files it can't auto-detect
- **Timestamp-precise citations** — subtitle-derived answers cite the exact `HH:MM:SS` range a claim came from
- **C-RAG pipeline** — query rewriting, step-back prompting, query decomposition, and HyDE run in parallel and are fused via Reciprocal Rank Fusion (RRF) before retrieval
- **Groundedness scoring** — every answer is scored 0–10 by an LLM judge; low-confidence answers automatically retry the pipeline
- **Guardrails** — input/output PII detection & masking, policy violation detection, and citation format validation, all scoped generically so any subject matter (not just one fixed course topic) works out of the box
- **Session-based history** — conversations are grouped into threads, not flat one-off Q&A logs; refreshing the page starts a new conversation thread
- **Authentication** — Clerk-based auth with protected routes
- **Async processing** — uploads are processed through a BullMQ job queue (ingestion → embedding) so large files don't block the UI; live status polling shows real-time progress

---

## 🧱 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + Express (ESM) |
| Auth | Clerk |
| LLM orchestration | LangChain.js |
| LLM provider | OpenAI (`gpt-4o` / `gpt-4o-mini`) |
| Vector DB | Qdrant |
| App DB | MongoDB |
| Queue | Redis + BullMQ |
| File storage | Cloudinary |
| Env management | dotenvx |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React (JavaScript) + Vite |
| Routing | react-router-dom v7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | lucide-react |
| Auth | Clerk React SDK |
| Fonts | Space Grotesk (headings), Inter (body) |

---

## 📁 Project Structure

```
Advanced_RAG/
├── backend/
│   └── src/
│       ├── config/            # mongodb, redis, qdrant, clerk, cloudinary
│       ├── llm-providers/     # OpenAI/Gemini/Grok router
│       ├── ingestion/         # universal + srt/vtt loaders, Cloudinary upload
│       ├── chunking/          # text & time-window chunkers
│       ├── vector-store/      # embeddings, upsert, query
│       ├── models/            # User, QueryHistory, CourseAccess, Document, IngestManifest
│       ├── guardrails/        # input/output PII, policy, format checks
│       ├── query-transform/   # rewrite, step-back, decompose, HyDE, router
│       ├── retrieval/         # retriever + RRF reranker
│       ├── generation/        # context building + answer generation
│       ├── evaluation/        # groundedness judge + C-RAG retry loop
│       ├── queue/              # BullMQ queues + ingestion/embedding workers
│       ├── routes/            # /api/ingest, /api/query, /api/history
│       └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/           # ProtectedRoute
        │   └── layout/         # AppShell, Sidebar, Topbar, Logo
        ├── hooks/              # useApi, useUpload, useQuery, useHistory, usePageTitle
        ├── lib/                # apiClient, uploadHelpers
        ├── pages/              # SignIn, SignUp, Upload, Query, History, HistoryDetail
        └── App.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker (for Qdrant + Redis)
- MongoDB Atlas account (or local MongoDB)
- Clerk account
- OpenAI API key
- Cloudinary account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Advanced_RAG

cd backend
npm install

cd ../frontend
npm install
```

### 2. Environment variables

**`backend/.env`**
```env
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your_openai_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PORT=3000
```

**`frontend/.env`**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Start infrastructure

```bash
cd backend
docker-compose up -d   # starts Qdrant (6333) + Redis (6379)
```

### 4. Run the backend

```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3000`. Must be started from the `backend/` root (not `backend/src/`) so `dotenvx` can locate `.env`.

### 5. Run the frontend

```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 📖 How It Works

### Upload flow
1. Select a folder (or individual files) — supported: `.srt` `.vtt` `.pdf` `.docx` `.pptx` `.csv` `.txt`
2. The system builds a manifest, auto-detecting each file's module number from its folder name
3. Files with an undetected module number can have one set manually
4. Each file uploads individually and is queued for processing (parsing → chunking → embedding)
5. Live status polling shows progress until each file is fully indexed

### Query flow
1. Ask a question in natural language
2. The query is rewritten, decomposed, and expanded (HyDE) in parallel, then all variants are searched against the vector store and fused via RRF
3. The top-ranked chunks are passed to the LLM, which must answer using **only** that context
4. The answer is scored for groundedness; low scores trigger an automatic retry
5. The final answer, its citations, and its score are saved to that session's history

### History
- All queries in a browser session (until refresh) belong to one conversation thread
- The History page lists threads grouped by conversation, most recent first
- Clicking a thread shows the full back-and-forth in order

---

## 🔮 Roadmap

- [ ] Video clip extraction via ffmpeg, using cited timestamps to jump to the exact moment in a lecture recording
- [ ] Course access authorization wired into retrieval (restrict which modules a user can query)
- [ ] Duplicate/stale chunk handling on re-ingestion of the same file
- [ ] Multi-provider LLM routing (Gemini/Grok) once quota/model issues are resolved

---

## 🐛 Known Limitations

- Old binary `.ppt` files are not supported (only the modern `.pptx` format) — save legacy presentations as `.pptx` before uploading
- Re-uploading the same file creates duplicate vector chunks rather than replacing the old ones
- No mobile-optimized layout beyond Tailwind's default responsive behavior

---

## 📄 License

Private project — not currently licensed for public use.