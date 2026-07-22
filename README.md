# 🇬🇧 English Day Challenge

A fun, boarding-pass-themed tracker for group "English only" days. Click a
traveller's name every time they slip into another language, watch the
"Most Wanted" leaderboard update live, and find out who owes the
1000 FCFA fine at the end of the day.

Frontend-only — no backend, no accounts. Everything is saved to your
browser's `localStorage`.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion (animations)
- Lucide React (icons)

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview   # preview the production build locally
```

## Deploying to Vercel

This project needs no special configuration:

1. Push the repository to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Framework preset: **Vite**. Build command: `npm run build`. Output
   directory: `dist`.
4. Deploy.

No environment variables are required.

## How it works

- **Participants** — each member is a boarding-pass style card. Tap the
  stamp button to log one mistake; a "Caught!" stamp animation confirms it.
- **Rename** — fix a typo or a nickname inline, no page reload.
- **Undo (misheard)** — rolls back one mistake for someone you caught by
  accident; disabled once their count is back at zero.
- **Remove** — delete a traveller from the day entirely, with a
  confirmation step.
- **Most Wanted** — the live leaderboard, ranked by mistake count.
- **Penalty card** — highlights whoever currently owes the 1000 FCFA fine
  (ties split the spotlight).
- **Add a traveller** — add new participants mid-day; they start at zero.
- **Reset English Day** — clears every counter back to zero, with a
  confirmation step.
- **New day detection** — if you open the app on a different calendar day
  than your last session, you'll be asked whether to start fresh or keep
  the running scores.
- **Dark mode & sound** — toggles in the header; both preferences persist
  locally. Sound effects are synthesized in-browser (no audio files).

## Project structure

```
src/
  components/   Header, MemberCard, Leaderboard, AddMemberForm,
                 PenaltyCard, ConfirmModal, Toast, StatsCard
  pages/         Home.tsx
  hooks/         useLocalStorage.ts
  types/         member.ts
  utils/         ranking.ts, sound.ts
```
