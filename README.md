# Weekend Trip Planner

A single-screen prototype that turns one natural-language trip request into three
structurally distinct cards — **stay → experience → food** — inside a chat shell.

Everything is client-side. There is no backend, no AI call, and no booking action:
the "planner" is a typed mock behind a real response contract, so the UI is
exercised exactly as it would be against a live service.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production check:

```bash
npm run build && npm start
```

## The flow

1. Type a request (e.g. *"two nights in austin for a birthday, something with live
   music"*). Empty or whitespace-only submissions are blocked.
2. The composer swaps to a thinking state with staged status text.
3. The response is validated at the boundary (`src/lib/planner/schema.ts`) and only
   then rendered as three cards, in a fixed order:
   - **Stay** — dates, nights, destination, nightly price, listing title, description
   - **Experience** — activity name, duration, day-by-day plan
   - **Food** — restaurant name, meal type, price range, description

Each card is its own layout; they are not the same template with different accents.

All sample content is clearly labelled as mock. Images are local placeholders — no
remote URLs, so nothing can render broken.

## Research hooks

Two public query parameters drive the required failure-and-recovery scenarios.
Both are read **once per browser tab** (via `sessionStorage`, with an in-memory
fallback) so a flag can never cause an endless failure loop.

| URL | What happens |
| --- | --- |
| `/?fail=once` | The first request in this tab fails deterministically. A friendly error bubble appears with **try again** (primary) and **start over**. `try again` resubmits the *exact same* request and succeeds. The flag is consumed, so a later request in the same tab succeeds normally. |
| `/?malformed=once` | The first response deliberately violates the contract. The validator rejects it before any card renders, the same friendly error appears, and retry recovers. |

Empty submissions, unexpected exceptions, repeated retry failures, very long
prompts, narrow viewports, reduced motion, keyboard-only use, and screen-reader
status announcements are all handled.

## Project shape

```
src/
  app/
    layout.tsx          fonts (Figtree body, Manrope display) + metadata
    page.tsx            the one static route
    globals.css         design tokens
  components/planner/
    TripPlanner.tsx     reducer-driven shell: thinking, retry, focus, live region
    Composer.tsx        auto-growing textarea, Enter to send
    Messages.tsx        guest bubble, plan, thinking, error notice
    PlanCard.tsx        exhaustive card-type dispatcher
    StayCard.tsx  ExperienceCard.tsx  FoodCard.tsx  CardImage.tsx  styles.ts
  lib/planner/
    schema.ts           discriminated union + parsePlannerResponse
    fixtures.ts         the mock trip, in one place
    planner.ts          planTrip, thinking stages
    once-flags.ts       consume-once flags with in-memory fallback
    research-flags.ts   URL flag parsing
    format.ts           date and currency formatting
```

## Checks

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run verify      # 14 contract checks against the response boundary
npm run build       # production build
```

`npm run verify` exercises the validator and `planTrip` directly: the shipped
fixture validates, card order is enforced, every required field survives, malformed
and reordered payloads are rejected, and forced failure is reported rather than
thrown.

## Design notes

- Type scale is limited to 12/13/14/24px with a `-0.15px` baseline tracking.
- Depth comes from borders only — no shadows, gradients, or glass effects.
- Icons come from Phosphor at 14px (nav) and 20px (card).
- Motion (`rise-in`, `dot-breathe`) is declared only inside
  `@media (prefers-reduced-motion: no-preference)`.
