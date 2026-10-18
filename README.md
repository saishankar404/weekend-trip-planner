# Weekend Trip Planner

A single-screen prototype that turns one natural-language trip request into three
structurally distinct cards — **stay → experience → food** — inside a chat shell.

Everything is client-side. There is no backend, no AI call, and no booking action:
the "planner" selects a weekend from a sample content pack behind a real typed
response contract, so the UI is exercised exactly as it would be against a live
service.

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

1. Type a request (e.g. *"a quiet weekend in kyoto with a tea ceremony and good
   ramen"*). Empty or whitespace-only submissions are blocked.
2. The composer swaps to a thinking state with staged status text.
3. The response is validated at the boundary (`src/lib/planner/schema.ts`) and only
   then rendered as three cards, in a fixed order:
   - **Stay** — dates, nights, neighbourhood, nightly price, total, property type,
     host, rating and review count, highlight
   - **Experience** — activity, category, host, rating, date and start time,
     duration, meeting point, availability, price
   - **Food** — place, cuisine and meal, neighbourhood, walk time, price level,
     estimated cost, booking note

Each card is its own layout; they are not the same template with different accents.

## Where the content comes from

All content is transcribed from **`Kyoto Weekend Prototype Content Pack.xlsx`** and
lives in exactly one module, `src/lib/planner/inventory.ts`:

| Sheet | Options | Notes |
| --- | --- | --- |
| Stays | S1–S4 | $366 / $312 / $249 / **$612** nightly totals for two nights |
| Experiences | E1–E4 | **E3 is sold out**; **E4 has no host** |
| Food | F1–F4 | **F2 has no booking note** |

The pack states a **$600 reference budget** for the weekend and carries no photo
URLs (image rights were not cleared) — which is why every card draws its own
placeholder rather than loading a remote asset.

The pack has four options per card but the prototype shows one of each, so
`src/lib/planner/select.ts` chooses. The rules are deliberately simple and every
one of them is visible in the result:

1. Only **bookable** options are considered. "Sold out" is excluded, and so is
   anything missing a required field — the pack leaves E4 without a host, and a
   hostless activity cannot be booked.
2. The **stay** is the highest-rated option that still leaves enough budget for the
   cheapest remaining experience and meal.
3. The **experience** is the highest-rated option that leaves enough for a meal.
4. The **meal** is the closest one to the stay that the money still covers, which
   is what makes the weekend walkable.

That produces **S1 + E1 + F1 — $516 of $600**, and all three land in Gion: a
machiya with a cedar tub, a tea ceremony, and a ramen counter eight minutes away.
An over-tight budget returns no plan rather than an incoherent one.

The pack's dates (11–13 April 2025) are in the past, so the weekend is shifted
forward to the next Friday–Sunday, keeping the same shape: two nights, activity on
the Saturday.

## Research hooks

Two public query parameters drive the required failure-and-recovery scenarios.
Both are read **once per browser tab** (via `sessionStorage`, with an in-memory
fallback) so a flag can never cause an endless failure loop.

| URL | What happens |
| --- | --- |
| `/?fail=once` | The first request in this tab fails deterministically. A friendly error bubble appears with **try again** (primary) and **start over**. `try again` resubmits the *exact same* request and succeeds. The flag is consumed, so a later request in the same tab succeeds normally. |
| `/?malformed=once` | The first response deliberately violates the contract (the food card is missing its cost). The validator rejects it before any card renders, the same friendly error appears, and retry recovers. |

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
    Messages.tsx        guest bubble, plan + budget line, thinking, error notice
    PlanCard.tsx        exhaustive card-type dispatcher
    StayCard.tsx  ExperienceCard.tsx  FoodCard.tsx  CardImage.tsx  styles.ts
  lib/planner/
    inventory.ts        the content pack, verbatim, plus the weekend dates
    select.ts           the budget rules that choose one weekend
    schema.ts           discriminated union + parsePlannerResponse
    fixtures.ts         the mock trip, built from the selection
    planner.ts          planTrip, thinking stages
    once-flags.ts       consume-once flags with in-memory fallback
    research-flags.ts   URL flag parsing
    format.ts           date, price, rating and time formatting
```

## Checks

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run verify      # 28 contract and selection checks
npm run build       # production build
```

`npm run verify` exercises the real validator, the real pack and the real
selection rules. It covers card order, every required field, and rejection of
malformed, reordered, short, non-object, mis-dated, out-of-range and
badly-timed payloads. It also covers the two genuinely blank pack cells: an
absent host or booking note is accepted, while a present-but-wrong type is still
rejected. On the selection side it proves the sold-out and hostless options can
never be booked, the total stays inside the reference budget, the chosen stay is
the highest-rated affordable one, the meal is the closest one the money covers,
and a budget too small to plan yields no plan at all.

## Design notes

- Type scale is limited to 12/13/14/24px with a `-0.15px` baseline tracking.
- Depth comes from borders only — no shadows, gradients, or glass effects.
- Icons come from Phosphor at 14px (nav) and 20px (card).
- Motion (`rise-in`, `dot-breathe`) is declared only inside
  `@media (prefers-reduced-motion: no-preference)`.
- Pack values are rendered verbatim, including capitalisation, rather than being
  quietly rewritten on the way to the screen.
