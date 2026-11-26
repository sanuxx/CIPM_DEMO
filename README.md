# eArrow Learning Portal — interactive LMS demo

Frontend-only demo (React + TypeScript + Vite + Tailwind CSS). There is no backend: all data lives in the browser's LocalStorage, and payments are simulated.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## Demo accounts (all fictional)

| Scenario | Email | Password |
|---|---|---|
| New student (not enrolled) | ishara.madushan@earrowdemo.example | Demo@123 |
| Active student (part-way through) | kasun.perera@earrowdemo.example | Demo@123 |
| Completed student (certificate) | dilini.wickramasinghe@earrowdemo.example | Demo@123 |
| Administrator | admin@earrowdemo.example | Admin@123 |

The login page signs in with one click. Registering a new student runs the full verify → intake → payment → enrollment flow.
Open the admin and student portals in two tabs: each tab keeps its own signed-in user and data changes sync live between tabs.

## Suggested demo flow

1. Register a student, verify email, choose an induction date, pay (the payment screen has a demo control to force a declined card; bank transfer stays *Pending* until an admin marks it paid).
2. Dashboard → open Module 1, Lesson 1: materials → video ("Skip to end (demo)") → quiz.
3. Show Modules 1–4 locking in sequence and Modules 5–8 open from day one.
4. Admin portal: edit a lesson/quiz, change an intake or enrollment, mark a payment, export a report CSV — then see the change in the student portal.
5. Completed student → My Certificates (preview, download SVG, print).

*Admin → Settings → Reset demo data* restores the original sample data.

## Business rules (implemented in `src/lib/progress.ts` and `src/store/logic.ts`)

- A lesson completes only after **Materials → Video → Quiz**, enforced in the store actions as well as the UI.
- **Sequential modules** stay locked until every earlier sequential module is complete; **independent modules** are never locked and block nothing. Order and type are admin-configurable.
- **No pass mark** — any submitted quiz attempt counts; attempts are limited per quiz or by the system default.
- Successful payment ⇒ enrollment; all lessons of a module ⇒ module complete; all modules ⇒ course complete ⇒ certificate.

## Notes

- Demo course content is fictional and not official eArrow curriculum or legal advice.
- Video protection is browser-level deterrence only (hidden source, no download/PiP/right-click, pause on focus loss, blank on PrintScreen, tiled per-student watermark). Truly preventing recording or link sharing needs server-side DRM (Widevine/FairPlay) and expiring signed URLs in production.
- Lessons use a simulated lecture player unless the admin supplies a real video URL.
- Certificate QR is a visual placeholder, not a scannable code.

## Live demo

Published with GitHub Pages: https://sanuxx.github.io/CIPM_DEMO/ (auto-deployed from `main` by `.github/workflows/deploy.yml`).
