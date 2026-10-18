/**
 * Contract checks for the planner boundary and the weekend selection.
 *
 *   npm run verify
 *
 * Runs against the real validator, the real pack and the real selection rules,
 * so a change to any of them that would let a broken payload reach a card
 * component — or a bad plan reach a guest — fails here.
 */
import assert from "node:assert/strict";

const schema = await import("../src/lib/planner/schema.ts");
const fixtures = await import("../src/lib/planner/fixtures.ts");
const planner = await import("../src/lib/planner/planner.ts");
const inventory = await import("../src/lib/planner/inventory.ts");
const select = await import("../src/lib/planner/select.ts");

const { parsePlannerResponse, nightsBetween } = schema;
const { buildMockTrip, buildMalformedResponse } = fixtures;
const { EXPERIENCES, FOOD, STAYS, REFERENCE_BUDGET, upcomingWeekend } = inventory;
const { isBookableExperience, selectWeekend } = select;

const checks = [];
function check(name, fn) {
  checks.push([name, fn]);
}

/* -------------------------------------------------------------------------- */
/* The contract                                                               */
/* -------------------------------------------------------------------------- */

check("the shipped fixture validates", () => {
  const result = parsePlannerResponse(buildMockTrip());
  assert.equal(result.ok, true, JSON.stringify(result.failure));
});

check("cards arrive in the stay → experience → food order", () => {
  const result = parsePlannerResponse(buildMockTrip());
  assert.deepEqual(
    result.response.cards.map((card) => card.cardType),
    ["stay", "experience", "food"],
  );
});

check("every required field survives validation", () => {
  const { cards } = parsePlannerResponse(buildMockTrip()).response;
  const [stay, experience, food] = cards;

  for (const key of [
    "listingTitle",
    "propertyType",
    "destination",
    "checkIn",
    "checkOut",
    "nightlyPrice",
    "totalPrice",
    "currency",
    "guestRating",
    "reviewCount",
    "hostFirstName",
    "highlight",
  ]) {
    assert.ok(stay.details[key] !== undefined && stay.details[key] !== "", `stay.${key}`);
  }

  for (const key of [
    "activityName",
    "category",
    "date",
    "startTime",
    "durationHours",
    "pricePerGuest",
    "totalPrice",
    "currency",
    "guestRating",
    "meetingPoint",
    "availability",
  ]) {
    assert.ok(
      experience.details[key] !== undefined && experience.details[key] !== "",
      `experience.${key}`,
    );
  }

  for (const key of [
    "restaurantName",
    "cuisine",
    "neighbourhood",
    "meal",
    "priceLevel",
    "estimatedCost",
    "currency",
    "walkMinutes",
  ]) {
    assert.ok(food.details[key] !== undefined && food.details[key] !== "", `food.${key}`);
  }
});

check("the budget summary survives validation", () => {
  const { budget } = parsePlannerResponse(buildMockTrip()).response;
  assert.equal(budget.reference, REFERENCE_BUDGET);
  assert.equal(budget.currency, "USD");
  assert.ok(budget.total > 0 && budget.total <= budget.reference);
});

check("nights are derived from the dates", () => {
  const stay = parsePlannerResponse(buildMockTrip()).response.cards[0].details;
  assert.equal(nightsBetween(stay.checkIn, stay.checkOut), 2);
});

/* -------------------------------------------------------------------------- */
/* Rejection                                                                  */
/* -------------------------------------------------------------------------- */

check("a malformed payload is rejected, not rendered", () => {
  const result = parsePlannerResponse(buildMalformedResponse());
  assert.equal(result.ok, false);
  assert.equal(result.failure.path, "response.cards[2].details.estimatedCost");
});

check("a missing card is rejected", () => {
  const trip = buildMockTrip();
  const result = parsePlannerResponse({ ...trip, cards: trip.cards.slice(0, 2) });
  assert.equal(result.ok, false);
});

check("cards out of order are rejected", () => {
  const trip = buildMockTrip();
  const result = parsePlannerResponse({ ...trip, cards: [...trip.cards].reverse() });
  assert.equal(result.ok, false);
});

check("a non-object payload is rejected", () => {
  for (const value of [null, undefined, "plan", 42, []]) {
    assert.equal(parsePlannerResponse(value).ok, false, String(value));
  }
});

check("a checkout before check-in is rejected", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [{ ...stay, details: { ...stay.details, checkOut: "2020-01-01" } }, experience, food],
  });
  assert.equal(result.ok, false);
});

check("an impossible date is rejected", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [{ ...stay, details: { ...stay.details, checkIn: "2026-02-31" } }, experience, food],
  });
  assert.equal(result.ok, false);
});

check("a rating outside 0–5 is rejected", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [
      stay,
      { ...experience, details: { ...experience.details, guestRating: 7.2 } },
      food,
    ],
  });
  assert.equal(result.ok, false);
  assert.equal(result.failure.path, "response.cards[1].details.guestRating");
});

check("a start time that isn't a clock time is rejected", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [stay, { ...experience, details: { ...experience.details, startTime: "25:99" } }, food],
  });
  assert.equal(result.ok, false);
  assert.equal(result.failure.path, "response.cards[1].details.startTime");
});

/* -------------------------------------------------------------------------- */
/* Data the pack leaves blank                                                 */
/* -------------------------------------------------------------------------- */

check("an absent host is accepted, not invented", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const { hostFirstName: _dropped, ...noHost } = experience.details;

  const result = parsePlannerResponse({
    ...trip,
    cards: [stay, { ...experience, details: noHost }, food],
  });

  assert.equal(result.ok, true, JSON.stringify(result.failure));
  assert.equal(result.response.cards[1].details.hostFirstName, undefined);
});

check("an absent booking note is accepted", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const { bookingNote: _dropped, ...noNote } = food.details;

  const result = parsePlannerResponse({
    ...trip,
    cards: [stay, experience, { ...food, details: noNote }],
  });

  assert.equal(result.ok, true, JSON.stringify(result.failure));
});

check("an absent food description is accepted and left to the filler", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;

  // The content pack ships no description for any food row.
  assert.equal(food.details.description, undefined);

  const { description: _dropped, ...noDescription } = food.details;
  const result = parsePlannerResponse({
    ...trip,
    cards: [stay, experience, { ...food, details: noDescription }],
  });

  assert.equal(result.ok, true, JSON.stringify(result.failure));
});

check("an absent day plan is accepted and left to the filler", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;

  // Likewise, no experience row in the pack carries a day-by-day plan.
  assert.equal(experience.details.dayPlan, undefined);

  const { dayPlan: _dropped, ...noPlan } = experience.details;
  const result = parsePlannerResponse({
    ...trip,
    cards: [stay, { ...experience, details: noPlan }, food],
  });

  assert.equal(result.ok, true, JSON.stringify(result.failure));
});

check("a day plan that is present must still be well formed", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [
      stay,
      { ...experience, details: { ...experience.details, dayPlan: [{ day: "Sat" }] } },
      food,
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.failure.path, "response.cards[1].details.dayPlan[0].plan");
});

check("a well formed day plan survives validation", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [
      stay,
      {
        ...experience,
        details: {
          ...experience.details,
          dayPlan: [{ day: "Sat 12 Apr", plan: "Bamboo grove and matcha tasting" }],
        },
      },
      food,
    ],
  });

  assert.equal(result.ok, true, JSON.stringify(result.failure));
  assert.equal(result.response.cards[1].details.dayPlan.length, 1);
});

check("a host of the wrong type is still rejected", () => {
  const trip = buildMockTrip();
  const [stay, experience, food] = trip.cards;
  const result = parsePlannerResponse({
    ...trip,
    cards: [stay, { ...experience, details: { ...experience.details, hostFirstName: 42 } }, food],
  });

  assert.equal(result.ok, false);
  assert.equal(result.failure.path, "response.cards[1].details.hostFirstName");
});
/* -------------------------------------------------------------------------- */
/* The planner                                                                */
/* -------------------------------------------------------------------------- */

check("planTrip returns a validated success", async () => {
  const outcome = await planner.planTrip("a quiet weekend in kyoto");
  assert.equal(outcome.ok, true);
});

check("planTrip reports a forced failure instead of throwing", async () => {
  const outcome = await planner.planTrip("a quiet weekend in kyoto", { forceFailure: true });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure.kind, "forced");
});

check("planTrip reports a contract violation as malformed", async () => {
  const outcome = await planner.planTrip("a quiet weekend in kyoto", { malformed: true });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure.kind, "malformed");
});

check("planTrip refuses an empty request", async () => {
  const outcome = await planner.planTrip("   ");
  assert.equal(outcome.ok, false);
});

/* -------------------------------------------------------------------------- */
/* Selection                                                                  */
/* -------------------------------------------------------------------------- */

check("the weekend is shifted off the pack's past dates", () => {
  const weekend = upcomingWeekend(new Date("2026-10-19T12:00:00Z"));

  // 2026-10-19 is a Monday, so the next Friday is the 23rd.
  assert.equal(weekend.checkIn, "2026-10-23");
  assert.equal(weekend.checkOut, "2026-10-25");

  const weekday = new Date(`${weekend.checkIn}T00:00:00Z`).getUTCDay();
  assert.equal(weekday, 5, "check-in should be a Friday");
  assert.equal(nightsBetween(weekend.checkIn, weekend.checkOut), 2);
  assert.ok(weekend.checkIn > "2025-04-13", "the pack's dates are in the past");
});

check("a sold-out option can never be booked", () => {
  const soldOut = EXPERIENCES.filter((option) => option.availability === "Sold out");
  assert.ok(soldOut.length > 0, "the pack ships a sold-out option to test against");

  for (const option of soldOut) {
    assert.equal(isBookableExperience(option), false, option.id);
  }

  assert.notEqual(selectWeekend().experience.id, soldOut[0].id);
});

check("an option missing a required field is not bookable", () => {
  const hostless = EXPERIENCES.filter((option) => !option.hostFirstName);
  assert.ok(hostless.length > 0, "the pack ships a hostless option to test against");
  assert.equal(isBookableExperience(hostless[0]), false);

  assert.notEqual(selectWeekend().experience.id, hostless[0].id);
});

check("the selection stays inside the reference budget", () => {
  const weekend = selectWeekend();
  assert.ok(weekend.total <= REFERENCE_BUDGET, `${weekend.total} > ${REFERENCE_BUDGET}`);

  const { budget, cards } = parsePlannerResponse(buildMockTrip()).response;
  const [stay, experience, food] = cards;
  assert.equal(
    budget.total,
    stay.details.totalPrice + experience.details.totalPrice + food.details.estimatedCost,
  );
});

check("the stay is the highest-rated one that still fits the weekend", () => {
  const bookableExperiences = EXPERIENCES.filter(isBookableExperience);
  const cheapestExperience = Math.min(...bookableExperiences.map((option) => option.totalPrice));
  const cheapestMeal = Math.min(...FOOD.map((option) => option.estimatedCost));
  const reserve = cheapestExperience + cheapestMeal;

  const affordable = STAYS.filter((stay) => stay.totalPrice + reserve <= REFERENCE_BUDGET);
  assert.ok(affordable.length > 0);

  const chosen = selectWeekend().stay;
  assert.ok(affordable.includes(chosen), `${chosen.id} is not affordable`);

  for (const stay of affordable) {
    assert.ok(stay.guestRating <= chosen.guestRating, `${stay.id} is rated higher than ${chosen.id}`);
  }
});

check("the meal is walkable from the stay", () => {
  const weekend = selectWeekend();
  const remaining = REFERENCE_BUDGET - weekend.stay.totalPrice - weekend.experience.totalPrice;
  const affordable = FOOD.filter((option) => option.estimatedCost <= remaining);
  assert.ok(affordable.length > 0);

  for (const option of affordable) {
    assert.ok(
      weekend.food.walkMinutes <= option.walkMinutes,
      `${option.id} is closer than ${weekend.food.id}`,
    );
  }
});

check("a budget too small to plan yields no plan, not a broken one", () => {
  assert.equal(selectWeekend(50), null);
  assert.equal(selectWeekend(0), null);
});

check("every card in the shipped plan traces back to the pack", () => {
  const { cards } = parsePlannerResponse(buildMockTrip()).response;
  const [stay, experience, food] = cards;

  assert.ok(
    STAYS.some((option) => option.listingTitle === stay.details.listingTitle),
    "stay is not from the pack",
  );
  assert.ok(
    EXPERIENCES.some((option) => option.activityName === experience.details.activityName),
    "experience is not from the pack",
  );
  assert.ok(
    FOOD.some((option) => option.restaurantName === food.details.restaurantName),
    "food is not from the pack",
  );
});

/* -------------------------------------------------------------------------- */

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
