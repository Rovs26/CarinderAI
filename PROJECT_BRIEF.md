# CarinderAI — Project Brief

## Goal
Hack sprint MVP: AI-powered ordering and operations assistant for Philippine carinderia owners. Deployable on Vercel.

## Core innovation
Camera/photo capture of handwritten supplier order lists → structured digital order → supplier draft (mock extraction in phase 1).

## Stack (phase 1)
- Next.js App Router, TypeScript, Tailwind CSS
- Local mock data only
- No Clerk, Supabase, or OpenAI yet

## Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing / marketing |
| `/owner` | Owner dashboard metrics |
| `/capture-order` | Main demo: photo → extract → confirm |
| `/finance` | Daily revenue/expense tracker |
| `/forecast` | Rule-based demand projection |
| `/discover` | Customer discovery (mock) |
| `/suppliers` | Supplier directory (mock) |

## Design
- White / warm gray background, dark text, orange accent `#ea580c`
- Flat, professional cards; no gradients or dark mode

## Phase 2 (out of scope for MVP)
- OpenAI vision extraction API route
- Supabase persistence
- Clerk auth
- Real supplier messaging
