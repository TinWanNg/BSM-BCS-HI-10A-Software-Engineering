## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TanStack Start (SSR) for pre-render |
| Routing | TanStack Router (file-based i.e. all files in `src/routes/` automatically become a route w/o manual config) |
| Data fetching | TanStack Query -- handles loadind, cache, and refetching |
| Backend/Auth | Supabase -- pgSQL, auth, and apis |
| UI | Radix UI + Tailwind CSS v4 (shadcn/ui style) |
| Build | Vite |

## Core Concept

A Tamagotchi-style health motivator:

1. **Track daily goals** — steps, water intake, sleep hours, weekly gym workouts
2. **Earn coins** — completing or exceeding a goal awards coins
3. **Spend coins in the shop** — buy food (boosts pet's *hunger* bar) or toys (boosts pet's *fun* bar)
4. **Pet welfare** — when hunger or fun drops below 30%, the pet alerts you to hit your goals

## Pages / Routes

| Route | Purpose |
|---|---|
| `/` | Landing / redirect |
| `/auth` | Login / register |
| `/onboarding` | Name your pet, pick from 4 pets stored in `src/lib/pets.ts`|
| `/home` | Dashboard: pet avatar + goal progress bars + mood |
| `/log` | Log today's steps, water, sleep, workouts |
| `/goals` | Set your goal targets |
| `/shop` | Buy food/toys with coins |
| `/settings` | User settings |

## Getting Started

```bash
npm install
npm run dev
```
