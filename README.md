# MEDISCOPE AI — by Altrix Labs

A fully interactive, hackathon-grade prototype of a unified AI health profile platform.

> **Live in-app deliverables**
> - `/` — cinematic 3D intro + marketing landing page
> - `/login`, `/signup` — secure 3D login/signup experience
> - `/dashboard` — interactive command center (charts, documents, AI imaging, copilot, timeline, profile)
> - `/architecture` — rendered system architecture (sandbox build + target production design)
> - `/presentation` — 10-slide interactive pitch deck (also mirrored in `PRESENTATION.md`)

## Important note on tech stack

The product brief asked for **React/Vite + Python FastAPI + MongoDB Atlas**. This project runs
inside a sandbox that only provisions **Next.js (App Router) + PostgreSQL (Drizzle ORM)**. Rather
than deliver non-runnable scaffolding for a stack the sandbox can't execute, this build re-implements
the *entire* product spec 1:1 on the supported stack so every feature is actually clickable and
testable end-to-end:

| Spec'd piece | Implemented here | Why it's equivalent |
|---|---|---|
| React + Vite frontend | React 19 via Next.js App Router | Same component model, routing instead of client router |
| Python FastAPI backend | Next.js Route Handlers for the web API plus a loopback Flask inference service | The local Python sidecar loads H5 models; the browser never receives model files or its service token |
| MongoDB Atlas | PostgreSQL + Drizzle ORM | Same document-shaped access patterns, normalized into typed tables |
| PDF/OCR / image models / copilot | PDF text extraction + local Tesseract OCR; local Keras/PyTorch image classifiers; localized rules | Models return experimental scores only; no clinical validation or hosted LLM is claimed |

Full detail, diagrams, and data-flow are documented at `/architecture` and in `ARCHITECTURE.md`.

## Technology stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion,
  Three.js / React-Three-Fiber, Recharts
- **Web/API backend:** Next.js 16.4 Route Handlers on Node.js, JWT (`jose`) httpOnly sessions,
   `bcryptjs` password hashing, same-origin mutation checks, and `react-dropzone` uploads.
- **Model backend:** Python 3.10 + Flask 3.1, Keras 3.12 with the PyTorch 2.9 backend. It binds only
   to `127.0.0.1:8001`; Next.js proxies authenticated user requests to it server-to-server.
- **Database:** PostgreSQL with Drizzle ORM (`src/db/schema.ts`), additive migrations in `drizzle/`.
- **Frontend libraries:** React 19, TypeScript 5.9, Tailwind CSS 4, Framer Motion, Three.js / R3F,
   Recharts, jsPDF, and `react-dropzone`.
- **Python image/runtime libraries:** Keras, PyTorch, NumPy, Pillow, h5py, Flask, and python-dotenv.
- **Document extraction:** `pdf-parse` reads selectable PDF text; Tesseract.js OCR runs locally on scanned
   PDFs and PNG/JPG uploads; field values retain the exact source excerpt.
- **AI/ML status:** Seven supplied image classifiers are available through a loopback-only Python
   service using Keras 3/PyTorch. Outputs are experimental model scores, not diagnoses or calibrated
   clinical probabilities. The health guide remains rule-based; no hosted LLM is integrated.
- **AI service layout:** `ai_service/app.py` is the private Flask service, `model.registry.json` is
   the allowlist/preprocessing map, `models_registry.py` lazy-loads one H5 at a time, `modules/`
   holds model adapters, `utils/` validates inputs, `tests/` checks service security, `reference/`
   preserves the supplied HTML mockup, and `models/` stores private weights.
- **Reports:** Authenticated, on-demand jsPDF preview/download from manually entered vitals and actual
   document extractions; demo/legacy data and simulated findings are excluded.

### Framework and library versions

| Area | Runtime/libraries |
|---|---|
| Web | Node.js 20.9+; Next.js 16.4; React/React DOM 19.2; TypeScript 5.9; Tailwind CSS 4.1 |
| UI | Framer Motion 14; Three.js/R3F; Recharts 3; react-dropzone 20 |
| Web API/auth | Next.js Route Handlers; Drizzle ORM 0.45; PostgreSQL; jose 6; bcryptjs 3 |
| PDF/OCR | pdf-parse 2.4; Tesseract.js 7; jsPDF 4.2; `@napi-rs/canvas` for scanned-PDF rasterization |
| Local image inference | Python 3.10; Flask 3.1; Keras 3.12; PyTorch 2.9; NumPy 2.2; Pillow 12; h5py 3.15 |
| Tests | Vitest 5; Node.js built-in test runner; Python `unittest` |

## AI model inventory

All enabled models accept RGB images resized to `224x224`. The user must select the model that
matches their image type; the application does not automatically detect or verify medical modality.
Most models use RGB values scaled to `0..1`. Retinopathy uses the normalization layers saved inside
its H5, so input pixels remain `0..255` before model inference. Keras output scores are experimental
model scores, not calibrated probabilities or a diagnosis.

| Model ID | Expected image | Outputs | Status |
|---|---|---|---|
| `pneumonia` | Chest X-ray | Normal; Pneumonia Detected | Enabled, binary sigmoid |
| `tuberculosis` | Chest X-ray | Normal; Tuberculosis Detected | Enabled, binary sigmoid |
| `brain_tumor` | Brain MRI | No Tumor; Glioma; Meningioma; Pituitary Tumor | Enabled, 4-class softmax |
| `retinopathy` | Retinal fundus image | No DR; Mild; Moderate; Severe; Proliferative DR | Enabled, 5-class softmax |
| `glaucoma` | Retinal fundus image | Normal; Glaucoma Detected | Enabled, binary sigmoid |
| `kidney_stone` | Ultrasound | Normal; Kidney Stone Detected | Enabled, binary sigmoid |
| `malaria` | Blood smear | Uninfected; Parasitized | Enabled, binary sigmoid |
| `skin_cancer` | Skin lesion | Unknown 7-class mapping | Disabled until a verified 7-label map is supplied |

H5 models are loaded lazily, one at a time, with safe Keras loading and input/output shape checks.
The eight H5 artifacts have mixed saved-Keras metadata: the seven enabled files report Keras 3.10,
while the disabled skin artifact reports Keras 2.2.4. All seven enabled models were loaded and
shape-smoke-tested on the local Keras 3.12/PyTorch runtime using generated synthetic images; this
does not establish model accuracy or clinical validity.
The original `ai_analysis.html` is retained under `ai_service/reference/`; the active themed UI is
the Next.js Disease Model Lab. `ai_service/model.registry.json` is the allowlist and output/preprocess
manifest, `ai_service/models_registry.py` implements lazy loading, and `ai_service/check_layers.py`
prints registry metadata without loading weights unless a model ID is supplied.
Run `npm run ai:models` to list registry entries without loading weights; run
`npm run ai:models -- brain_tumor` to load and inspect one explicitly selected model.

## Project map

```text
src/app/                 Next pages and authenticated API routes
src/components/          Dashboard, upload, report, and disease-model UI
src/db/                  PostgreSQL schema and Drizzle ORM setup
src/lib/                  Auth, OCR, storage, reporting, and copilot helpers
ai_service/app.py         Private loopback Flask inference API
ai_service/models/        Seven enabled H5 weights and one disabled skin H5 weight
ai_service/model.registry.json
ai_service/models_registry.py
ai_service/modules/       Thin model-specific adapters
ai_service/utils/         Image validation and model preprocessing
ai_service/tests/         Python service security/registry tests
ai_service/reference/     Preserved original HTML prototype
ai_service/data/          Preserved supplied OCR traineddata file
drizzle/                  Database migrations and migration journal
tests/                    Vitest and full-stack API integration tests
```

## Key features

1. **Cinematic 3D intro** — heartbeat ECG draw-on animation → rotating holographic core (Three.js)
   → staggered "MEDISCOPE AI" title reveal.
2. **Secure 3D login/signup** — glassmorphic card over a floating hologram background; bcrypt-hashed
   passwords, signed httpOnly JWT session cookies, instant "Judge/Investor Demo Login".
3. **Interactive dashboard** — collapsible sidebar, user-entered vitals trend chart, document
   review status, recent documents and timeline backed by PostgreSQL.
4. **Document extraction** — selectable PDF text is parsed directly; scanned PDFs and images use
   Tesseract OCR with measured recognition confidence. Structured values show their source excerpt.
5. **Disease model lab** — select one of seven metadata-compatible H5 image classifiers. Results
   show class scores only; there are no diagnoses or clinical risk labels.
6. **Multilingual health guide** — rule-based English, Telugu, and Hindi prompts respond from the
   signed-in user's manually entered vitals and source-labelled document text. Extracted source text
   is not automatically translated.
7. **Unified health timeline** — chronological feed of every document, analysis, vitals log, and
   manual note, filterable by type.
8. **Medical Report Card** — on-demand PDF preview and download, limited to the account owner's real
   entered values and document extractions.
9. **Profile** — editable personal details, blood group, language preference, quick vitals logging.

## Running locally

Prerequisites: Node.js 20.9+, Python 3.10, and either Docker Desktop or PostgreSQL 16+ on Windows.

In PowerShell, from the project folder:

```powershell
npm install
Copy-Item .env.example .env  # only if you do not already have a .env
npm run db:up:local
npm run db:push  # initial database only; creates the base tables
npm run db:migrate
py -3.10 -m pip install -r ai_service/requirements.txt
npm run dev
```

`npm run dev` starts the local Python disease-model service and Next.js together, then opens the
website at `http://localhost:3000`. The service listens only on loopback (normally
`127.0.0.1:8001`); Next.js forwards images server-to-server using `AI_SERVICE_TOKEN`. Do not expose
this port publicly. If you need to start only the web app, use `npm run dev:web`; run `npm run ai:dev`
in a separate terminal when starting the model service manually.

`npm run db:up:local` starts an isolated, loopback-only database under
`%LOCALAPPDATA%\MEDISCOPE\postgres-data` on port `5433`, without changing the existing PostgreSQL
instance. Stop it with `pg_ctl -D "$env:LOCALAPPDATA\MEDISCOPE\postgres-data" stop` from PowerShell.
Docker users can run `npm run db:up` instead. Skip `npm run db:push` on an already initialized
database; use the checked-in migrations to apply subsequent schema changes.

`npm run db:push` is intended for local development and initial local schema creation. For an existing database, back it up and apply
the checked-in additive migration with `npm run db:migrate`. The migration labels historical OCR,
analysis, and vital rows as legacy/demo/unknown rather than claiming they are genuine source data.

Create an account at `/signup`; successful signup creates a session and opens the dashboard. Later,
sign in at `/login` with the same email and password. The demo login is also available. Local
database settings and a development-only session secret are provided in `.env.example`; do not use
those credentials or the example secret in production.
Set `AUTH_SECRET` to a private random value of at least 32 characters in production. The shared demo
login is disabled in production.

To build and serve the production bundle locally, run `npm run build` and then `npm run start`.

## Tests

```powershell
npm test
npm run test:integration  # requires DB schema, Next.js server, and local AI service
npm run ai:test
npm run typecheck
npm run lint
npm run build
```

The integration test requires both the Next app and AI service to be running. It creates and deletes
isolated test accounts/uploads and verifies PDF/OCR extraction, real H5 inference and score
persistence, disabled-model rejection, signup/login, private storage/ownership, report scoping, and
cross-origin rejection. Tesseract downloads language data on first use. Model inference runs locally;
no image is sent to an external AI provider.

## API and database

Web APIs are Next.js Route Handlers, guarded by JWT sessions and owner checks:

| Route | Purpose |
|---|---|
| `/api/auth/signup`, `/login`, `/logout`, `/me`, `/demo` | Account and session lifecycle; shared demo login is development-only |
| `/api/documents`, `/api/documents/[id]` | Upload/list/delete document metadata |
| `/api/documents/[id]/file` | Owner-checked private PDF/image delivery |
| `/api/models` | Authenticated allowlisted disease-model catalog |
| `/api/analyses` | Owner-checked image inference proxy and saved scores |
| `/api/reports` | Current user's report data; sample/legacy data is excluded |
| `/api/vitals`, `/api/timeline`, `/api/chat`, `/api/health` | Vitals, activity, rule-based multilingual guide, and health check |

PostgreSQL tables are `users`, `documents`, `analyses`, `timeline_events`, `chat_messages`, and
`vitals`. Documents store an owner ID, private file path, OCR text, extraction provenance, and
source-linked fields. Analyses store the owning user/document, model ID, model-score vector, engine,
and legacy provenance. Foreign keys cascade account/document deletion. Database shape is defined in
`src/db/schema.ts`; additive schema changes live in `drizzle/`.

`.env.example` lists the required configuration names:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret; production requires a private value of at least 32 characters |
| `AI_SERVICE_URL` | Loopback Flask URL, normally `http://127.0.0.1:8001` |
| `AI_SERVICE_TOKEN` | Shared secret used only between Next.js and the local Flask service |

The Flask service binds to loopback and validates the token on every `/v1` request. It accepts only
PNG/JPEG images up to 15 MB, checks image decoding and pixel limits, and loads one allowlisted H5 at
a time. The browser never receives the token or direct access to the service.

## Disclaimers

MEDISCOPE AI is a hackathon prototype, not a certified medical device. OCR is genuine transcription
but may be inaccurate; verify every extracted value against its source file. The health guide is
rule-based and is not a hosted LLM. Supplied disease models are unvalidated experimental classifiers;
their scores are not calibrated clinical probabilities and must not guide care. Skin remains disabled
until its class map is verified. Reports are account-data exports, not diagnoses or substitutes for
professional healthcare advice. Local files are not encrypted at rest. Production use still requires
security review, encryption/key management, retention policy, rate limiting, auditing, and clinical
validation.
