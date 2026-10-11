# MEDISCOPE AI — Pitch Deck (10 slides)

Also viewable as an interactive in-app deck at `/presentation` (arrow keys / buttons to navigate).

---

## 1. Title
**MEDISCOPE AI** — a unified, AI-powered health profile, by Altrix Labs.
- Hackathon functional prototype
- PDF text extraction · Tesseract OCR · seven local experimental image models
- Built for software employees, healthtech enthusiasts, judges & investors

## 2. Problem
Health data is scattered and unreadable.
- Patients juggle PDFs, printed reports, WhatsApp scans across clinics & labs
- Medical jargon is inaccessible without a doctor nearby to translate it
- No single timeline connects vitals, prescriptions, scans and diagnoses
- Regional language support is almost nonexistent in health apps

## 3. Solution
One AI-unified health command center.
- Drag-and-drop OCR ingestion of any report, prescription or scan
- Select a supplied disease-image model and inspect experimental class scores
- Source-grounded rule-based prompts in English, Telugu and Hindi
- A single chronological timeline — your whole health story, connected

## 4. Live demo flow
What judges can click through right now.
- Cinematic 3D intro → secure 3D login (JWT + bcrypt)
- Interactive dashboard: private documents, user-entered vitals, and review status
- Upload a report → watch OCR extraction happen in real time
- Upload an image → select its model and view saved score provenance
- Use localized prompts grounded in source-labelled account data

## 5. AI approach
AI you can trust — because it's transparent.
- PDF text is parsed directly; scanned PDFs and images use local Tesseract OCR
- Extracted measurements include source excerpts and require human verification
- Supplied H5 models return experimental scores, not diagnoses or clinical probabilities
- Skin model remains disabled because its seven outputs lack a verified class map
- No hosted LLM is connected; imaging outputs are not clinically validated
- The multilingual guide uses rules; source text is not translated
- Production needs clinical validation, managed secrets, encrypted storage, and audit controls

## 6. Architecture
Built to scale from day one.
- Frontend: React/Vite or Next.js, TypeScript, Tailwind, Framer Motion, Three.js
- Backend: Python FastAPI (spec) — demoed here on Next.js Route Handlers
- Database: MongoDB Atlas (spec) — demoed here on PostgreSQL + Drizzle ORM
- Clean service boundaries mean either backend/DB pairing is a drop-in swap
- Full diagram: see `ARCHITECTURE.md` / `/architecture`

## 7. Market & impact
Why this matters beyond the hackathon.
- 1.4B+ people in India alone would benefit from regional-language health AI
- Clinics & diagnostic chains lose time re-keying scanned reports manually
- Unified profiles reduce redundant tests and improve continuity of care
- Enterprise angle: white-label unified health record layer for hospital groups

## 8. Limitations (stated clearly)
What this prototype is — and isn't.
- Not a certified medical device; supplied image models are experimental and not clinically validated
- OCR is real transcription but may be inaccurate; verify values against original files
- Image model outputs are experimental and not clinically validated; the health guide is not a hosted LLM
- The localized guide is rule-based and does not translate source transcriptions
- Private file storage is local and not encrypted at rest; this is not production/HIPAA-ready

## 9. Roadmap
From prototype to pilot.
- Clinically validate and independently test supplied models before considering care workflows
- Add clinician review workflow & audit trail for AI-flagged cases
- Wearables integration (SpO2, HR, CGM) for continuous vitals
- Pilot with 1–2 diagnostic chains; measure time-to-insight & patient comprehension

## 10. Ask
Let's build the unified health layer, together.
- Seeking: hackathon recognition, mentorship, and pilot partners
- Team Altrix Labs — full-stack, AI/ML, and product design in-house
- Try it now: instant judge/investor demo login on the login page

Thank you — questions welcome.
