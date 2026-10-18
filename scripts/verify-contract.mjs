/**
 * Contract checks for the planner boundary.
 *
 *   npm run verify
 *
 * Runs against the real validator and the real fixtures, so a change to either
 * one that would let a broken payload reach a card component fails here.
 */
import assert from "node:assert/strict";

const schema = await import("../src/lib/planner/schema.ts");
const fixtures = await import("../src/lib/planner/fixtures.ts");
const planner = await import("../src/lib/planner/planner.ts");

const { parsePlannerResponse, nightsBetween } = schema;
const { MOCK_TRIP, MALFORMED_RESPONSE } = fixtures;

const checks = [];
function check(name, fn) {
  checks.push([name, fn]);
}

check("the shipped fixture validates", () => {
  const result = parsePlannerResponse(MOCK_TRIP);
  assert.equal(result.ok, true, JSON.stringify(result.failure));
});

check("cards arrive in the stay → experience → food order", () => {
  const result = parsePlannerResponse(MOCK_TRIP);
  assert.deepEqual(
    result.response.cards.map((card) => card.cardType),
    ["stay", "experience", "food"],
  );
});

check("every required field survives validation", () => {
  const { cards } = parsePlannerResponse(MOCK_TRIP).response;
  assert.ok(cards[0].details.destination);
  assert.ok(cards[0].details.checkIn);
  assert.ok(cards[0].details.checkOut);
  assert.ok(cards[0].details.nightlyPrice);
  assert.ok(cards[0].details.description);
  assert.ok(cards[0].details.listingTitle);
  assert.ok(cards[1].details.activityName);
  assert.ok(cards[1].details.duration);
  assert.ok(cards[1].details.dayPlan.length > 0);
  assert.ok(cards[2].details.restaurantName);
  assert.ok(cards[2].details.mealType);
  assert.ok(cards[2].details.priceRange);
  assert.ok(cards[2].details.description);
});

check("nights are derived from the dates", () => {
  const stay = parsePlannerResponse(MOCK_TRIP).response.cards[0].details;
  assert.equal(nightsBetween(stay.checkIn, stay.checkOut), 2);
});

check("a malformed payload is rejected, not rendered", () => {
  const result = parsePlannerResponse(MALFORMED_RESPONSE);
  assert.equal(result.ok, false);
  assert.equal(result.failure.path, "response.cards[2].details.priceRange");
});

check("a missing card is rejected", () => {
  const result = parsePlannerResponse({ ...MOCK_TRIP, cards: MOCK_TRIP.cards.slice(0, 2) });
  assert.equal(result.ok, false);
});

check("cards out of order are rejected", () => {
  const result = parsePlannerResponse({ ...MOCK_TRIP, cards: [...MOCK_TRIP.cards].reverse() });
  assert.equal(result.ok, false);
});

check("a non-object payload is rejected", () => {
  for (const value of [null, undefined, "plan", 42, []]) {
    assert.equal(parsePlannerResponse(value).ok, false, String(value));
  }
});

check("a checkout before check-in is rejected", () => {
  const result = parsePlannerResponse({
    ...MOCK_TRIP,
    cards: [
      { ...MOCK_TRIP.cards[0], details: { ...MOCK_TRIP.cards[0].details, checkOut: "2026-10-20" } },
      MOCK_TRIP.cards[1],
      MOCK_TRIP.cards[2],
    ],
  });
  assert.equal(result.ok, false);
});

check("an impossible date is rejected", () => {
  const result = parsePlannerResponse({
    ...MOCK_TRIP,
    cards: [
      { ...MOCK_TRIP.cards[0], details: { ...MOCK_TRIP.cards[0].details, checkIn: "2026-02-31" } },
      MOCK_TRIP.cards[1],
      MOCK_TRIP.cards[2],
    ],
  });
  assert.equal(result.ok, false);
});

check("planTrip returns a validated success", async () => {
  const outcome = await planner.planTrip("a slow weekend in austin");
  assert.equal(outcome.ok, true);
});

check("planTrip reports a forced failure instead of throwing", async () => {
  const outcome = await planner.planTrip("a slow weekend in austin", { forceFailure: true });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure.kind, "forced");
});

check("planTrip reports a contract violation as malformed", async () => {
  const outcome = await planner.planTrip("a slow weekend in austin", { malformed: true });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure.kind, "malformed");
});

check("planTrip refuses an empty request", async () => {
  const outcome = await planner.planTrip("   ");
  assert.equal(outcome.ok, false);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    await fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${error.message.split("\n")[0]}`);
  }
}

console.log(`\n${checks.length - failed}/${checks.length} contract checks passed`);
process.exit(failed === 0 ? 0 : 1);
