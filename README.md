# IELTS Academic · Band 6 → 7 · 10-Week Program

A self-contained, interactive study site for IELTS Academic candidates moving from Band 6 to Band 7. No build step, no dependencies — plain HTML/CSS/JS.

## What's here

- `index.html` — hub with the full 10-week curriculum and a day-by-day tile grid
- `day-01.html` … `day-21.html` — Weeks 1–3, each a complete daily lesson with real practice content (passages, listening scripts, charts, model answers, answer keys)
- `assets/lesson.css`, `assets/lesson.js` — shared engine: highlighter → personal vocabulary list, per-section notes (autosaved), exam timer, answer reveals, self-scoring checklists, progress tracking. All state lives in the browser via `localStorage`.

## Status

Weeks 1–3 (Days 1–21) are complete. Weeks 4–10 (Days 22–70) are in progress.

- **Week 1** (Days 1–7): diagnostic baseline, Band 6 foundations
- **Week 2** (Days 8–14): reading & listening engine, deliberately harder than the real exam, Checkpoint 1
- **Week 3** (Days 15–21): Writing Task 1 mastery, all six visual types, calibrated to authentic real-exam difficulty

## Running locally

No build tools needed — open `index.html` directly in a browser, or serve the folder:

```
python -m http.server 8000
```

## Deployment

Static site, zero configuration needed for Vercel — just import the repo.
