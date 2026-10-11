# MEDISCOPE AI — Architecture

Also viewable live at `/architecture` inside the running app.

## 1. High-level system diagram (as running in this sandbox)

```mermaid
flowchart TB
    subgraph Client["Client Layer — Browser"]
        A1["Next.js App Router (React 19 + TypeScript)"]
        A2["Tailwind CSS — glassmorphism design system"]
        A3["Framer Motion — cinematic transitions"]
        A4["Three.js / React-Three-Fiber — 3D hologram intro + login"]
        A5["Recharts — user-entered vitals trends"]
    end

    subgraph API["Application Layer — Next.js Route Handlers (Node.js runtime)"]
        B1["/api/auth/* — signup, login, demo, me"]
        B2["/api/documents/* — upload, list, delete"]
        B3["/api/analyses — owner-checked model inference proxy"]
        B8["/api/models — authenticated model catalog"]
        B4["/api/chat — source-grounded rule-based guide"]
        B5["/api/timeline — unified event feed"]
        B6["/api/vitals — vitals logging"]
        B7["/api/reports — owner-scoped report data"]
        MW["proxy.ts — JWT and same-origin mutation checks"]
    end

    subgraph AI["Local experimental model service and extraction"]
        C1["pdf-parse text extraction + local Tesseract OCR"]
        C2["Loopback Flask service: Keras 3 + PyTorch backend"]
        C3["Seven supplied H5 image models; scores only, not diagnoses"]
        C4["Rule-based guide (EN / TE / HI), source text not translated"]
        C5["jsPDF report generated on demand in browser"]
    end

    subgraph Data["Data Layer"]
        D1[("PostgreSQL via Drizzle ORM")]
        D2["Private local filesystem storage (data/uploads)"]
    end

    Client -->|fetch / form submit| API
    API --> AI
    API --> D1
    API --> D2
    API -->|private image + service token| C2
    Client -->|preview / download| C5
    MW -. protects .-> API
```

## 2. Data model

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : uploads
    USERS ||--o{ ANALYSES : owns
    USERS ||--o{ TIMELINE_EVENTS : owns
    USERS ||--o{ CHAT_MESSAGES : sends
    USERS ||--o{ VITALS : logs
    DOCUMENTS ||--o{ ANALYSES : "analyzed into"

    USERS {
        text id PK
        text name
        text email
        text password_hash
        text preferred_language
        text blood_group
        text avatar_color
    }
    DOCUMENTS {
        text id PK
        text user_id FK
        text file_name
        text file_type
        text category
        text ocr_text
        real ocr_confidence
        text extraction_method
        jsonb extracted_fields
        boolean is_image
    }
    ANALYSES {
        text id PK
        text document_id FK
        text user_id FK
        text summary
        jsonb findings
        real confidence
        text risk_level
        text analysis_engine
        text model_id
        jsonb model_scores
    }
    TIMELINE_EVENTS {
        text id PK
        text user_id FK
        text type
        text title
        text description
        jsonb metadata
    }
    CHAT_MESSAGES {
        text id PK
        text user_id FK
        text role
        text content
        text language
    }
    VITALS {
        text id PK
        text user_id FK
        text type
        real value
        text unit
        text source
    }
```

## 3. Document → insight data flow

```
Authenticated drag & drop PDF/PNG/JPG (15MB maximum; file signature checked)
        │
        ▼
POST /api/documents ── saves file outside public/ under data/uploads/{userId}/…
        │
        ▼
Selectable PDF text: pdf-parse │ scanned PDF/image: local Tesseract OCR
        │
        ▼
Real extracted text, measured OCR confidence, and source excerpts persisted transactionally
        │
        ▼
Owner-checked file route, documents explorer, source-labelled copilot, and report endpoint
        │
        ▼
(Images only) user selects model → authenticated POST /api/analyses proxies private bytes to loopback service
        │
        ▼
Selected H5 returns class scores; result and provenance persist under the owning account
```

## 4. Target production architecture (as originally specified)

| Layer | Specified technology |
|---|---|
| Frontend | React 18 + Vite, TypeScript, Tailwind CSS, Framer Motion, Three.js |
| Backend | Python FastAPI, Pydantic schemas, async workers (Celery + Redis) for OCR/vision jobs |
| AI services | Local Tesseract OCR; supplied experimental image classifiers; future clinical validation and optional hosted LLM/RAG |
| Database | MongoDB Atlas — `users`, `documents`, `analyses`, `timeline_events`, `chat_messages`, `vitals` collections |
| Infra | Docker, CI/CD, S3-compatible object storage for scans, HIPAA/DPDP-aligned access controls |

## 5. Why the sandbox substitution is safe

Both stacks expose the same contract:

- Stateless REST endpoints keyed by an authenticated `userId`
- A relational/document store with the same six entities (`users`, `documents`, `analyses`,
  `timeline_events`, `chat_messages`, `vitals`)
- Server-side session auth (JWT) with hashed passwords
- A private Next-to-Flask inference contract. The Flask service loads one allowlisted Keras model at
    a time; model IDs, class maps and preprocessing are declared in `ai_service/model.registry.json`.

This lets the local prototype run supplied classifiers without exposing model files or service
credentials to the browser. Production still requires clinical model validation, managed secrets,
scalable inference hosting and clinical governance.

## 6. Limitations disclosed

- PDF text extraction and Tesseract OCR are real transcription, but OCR may be inaccurate and is not
    a clinical interpretation. Tesseract language data is downloaded on first use and cached locally.
- Seven user-supplied image H5 files load one at a time through Keras 3/PyTorch. Their outputs are
    experimental scores only, not clinical probabilities or diagnoses. Skin is disabled because its
    seven outputs do not match the supplied two-label map. No tabular heart model is included.
- There is no hosted LLM. The multilingual health guide is rule-based, uses account-scoped sources,
    and does not translate the original transcription.
- Files are stored outside `public/` and served through owner checks, but local disk is not encrypted
    at rest and is not a production object store.
- Report PDFs include account data/source transcription only, are generated on demand, and are not
    signed or clinically validated.
- Nothing in this application is a certified medical device or a substitute for professional care.
