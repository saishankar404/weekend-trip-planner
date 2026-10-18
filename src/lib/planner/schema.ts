/**
 * Response contract for the trip planner.
 *
 * This module is the boundary: everything the planner produces is `unknown`
 * until it passes `parsePlannerResponse`. The UI only ever renders validated
 * cards, so a malformed response can never reach a card component.
 *
 * The field set follows the content pack rather than the other way round, so
 * every column the pack ships has somewhere to land — except the two the pack
 * leaves blank, which are optional here and never invented.
 */

export const CARD_TYPES = ["stay", "experience", "food"] as const;

export type CardType = (typeof CARD_TYPES)[number];

/** The success response always carries exactly three cards, in this order. */
export const CARD_ORDER: readonly CardType[] = ["stay", "experience", "food"];

/** What the three cards add up to, and what they were chosen against. */
export type BudgetSummary = {
  /** The pack's $600 reference budget. */
  reference: number;
  /** What the selected stay, experience and meal actually cost. */
  total: number;
  currency: string;
};

export type StayDetails = {
  listingTitle: string;
  propertyType: string;
  /** Neighbourhood and city, e.g. "Gion, Kyoto". */
  destination: string;
  /** ISO date (YYYY-MM-DD) the guest checks in. */
  checkIn: string;
  /** ISO date (YYYY-MM-DD) the guest checks out. */
  checkOut: string;
  /** Nightly price in whole currency units. */
  nightlyPrice: number;
  /** Total for the whole stay. */
  totalPrice: number;
  /** ISO 4217 code, kept explicit so formatting never guesses. */
  currency: string;
  guestRating: number;
  reviewCount: number;
  hostFirstName: string;
  highlight: string;
};

/**
 * One row of an activity's day-by-day plan.
 *
 * Required by the Stage 1 card spec but absent from every row in the content
 * pack, so it is optional here and the card fills the gap rather than dropping
 * the field.
 */
export type DayPlan = {
  day: string;
  plan: string;
};

export type ExperienceDetails = {
  activityName: string;
  category: string;
  /** ISO date (YYYY-MM-DD) the activity runs. */
  date: string;
  /** Local start time, e.g. "10:30". */
  startTime: string;
  durationHours: number;
  pricePerGuest: number;
  totalPrice: number;
  currency: string;
  guestRating: number;
  /** Optional: the pack lists no host for E4. */
  hostFirstName?: string;
  meetingPoint: string;
  availability: string;
  /** Optional: no row in the content pack supplies one. */
  dayPlan?: DayPlan[];
};

export type FoodDetails = {
  restaurantName: string;
  cuisine: string;
  neighbourhood: string;
  meal: string;
  /** "$" | "$$" | "$$$". */
  priceLevel: string;
  /** Estimated cost for two. */
  estimatedCost: number;
  currency: string;
  walkMinutes: number;
  /** Optional: the pack lists no booking note for F2. */
  bookingNote?: string;
  /** Optional: no row in the content pack supplies one. */
  description?: string;
};

export type StayCard = {
  cardType: "stay";
  id: string;
  details: StayDetails;
};

export type ExperienceCard = {
  cardType: "experience";
  id: string;
  details: ExperienceDetails;
};

export type FoodCard = {
  cardType: "food";
  id: string;
  details: FoodDetails;
};

export type PlannerCard = StayCard | ExperienceCard | FoodCard;

export type PlannerResponse = {
  /** Stable id for the request/response pair. */
  requestId: string;
  /** One short line that frames the three cards. Not a paragraph. */
  summary: string;
  /**
   * True for every fixture in this prototype. The UI surfaces this so guests
   * never mistake sample listings and prices for real inventory.
   */
  mock: boolean;
  budget: BudgetSummary;
  cards: PlannerCard[];
};

export type ParseFailure = {
  /** Machine-readable reason, useful in logs and in research notes. */
  reason: string;
  /** Path to the offending field, e.g. "cards[0].details.checkIn". */
  path: string;
};

export type ParseResult =
  | { ok: true; response: PlannerResponse }
  | { ok: false; failure: ParseFailure };

/* -------------------------------------------------------------------------- */
/* Narrowing helpers                                                          */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(reason: string, path: string): ParseResult {
  return { ok: false, failure: { reason, path } };
}

function readString(
  source: Record<string, unknown>,
  key: string,
  path: string,
): { ok: true; value: string } | { ok: false; failure: ParseFailure } {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, failure: { reason: "expected a non-empty string", path: `${path}.${key}` } };
  }
  return { ok: true, value };
}

/**
 * Reads a field the pack may leave blank. An absent or empty value is accepted
 * as `undefined`; anything present but the wrong type is still rejected, so
 * this is tolerance for missing data rather than for malformed data.
 */
function readOptionalString(
  source: Record<string, unknown>,
  key: string,
  path: string,
): { ok: true; value: string | undefined } | { ok: false; failure: ParseFailure } {
  const value = source[key];
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") {
    return { ok: false, failure: { reason: "expected a string", path: `${path}.${key}` } };
  }
  const trimmed = value.trim();
  return { ok: true, value: trimmed === "" ? undefined : trimmed };
}

/**
 * Reads an optional day-by-day plan.
 *
 * Absent is fine — the content pack supplies none — but present-and-malformed
 * is still rejected, so the filler treatment can never hide a broken payload.
 */
function readOptionalDayPlan(
  source: Record<string, unknown>,
  key: string,
  path: string,
): { ok: true; value: DayPlan[] | undefined } | { ok: false; failure: ParseFailure } {
  const value = source[key];
  if (value === undefined || value === null) return { ok: true, value: undefined };

  if (!Array.isArray(value) || value.length === 0) {
    return {
      ok: false,
      failure: { reason: "expected a non-empty array", path: `${path}.${key}` },
    };
  }

  const parsed: DayPlan[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    const entryPath = `${path}.${key}[${index}]`;
    if (!isRecord(entry)) {
      return { ok: false, failure: { reason: "expected an object", path: entryPath } };
    }
    for (const field of ["day", "plan"]) {
      const read = readString(entry, field, entryPath);
      if (!read.ok) return { ok: false, failure: read.failure };
    }
    parsed.push({ day: entry.day as string, plan: entry.plan as string });
  }

  return { ok: true, value: parsed };
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
  path: string,
  { min = 0, max = Number.POSITIVE_INFINITY } = {},
): { ok: true; value: number } | { ok: false; failure: ParseFailure } {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, failure: { reason: "expected a finite number", path: `${path}.${key}` } };
  }
  if (value < min || value > max) {
    return {
      ok: false,
      failure: { reason: `expected a number between ${min} and ${max}`, path: `${path}.${key}` },
    };
  }
  return { ok: true, value };
}

/** Parses YYYY-MM-DD into a UTC timestamp, or null when it isn't a real date. */
export function parseIsoDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const roundTrip = new Date(timestamp);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    return null;
  }
  return timestamp;
}

/** A 24-hour clock time, e.g. "10:30". */
export function parseClockTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

/** Nights between two ISO dates, or null when the range is invalid. */
export function nightsBetween(checkIn: string, checkOut: string): number | null {
  const start = parseIsoDate(checkIn);
  const end = parseIsoDate(checkOut);
  if (start === null || end === null) return null;
  const nights = Math.round((end - start) / MS_PER_NIGHT);
  return nights > 0 ? nights : null;
}

/* -------------------------------------------------------------------------- */
/* Card validators                                                            */
/* -------------------------------------------------------------------------- */

function parseStay(details: Record<string, unknown>, path: string): ParseResult | null {
  const strings: Record<string, string> = {};
  for (const key of [
    "listingTitle",
    "propertyType",
    "destination",
    "checkIn",
    "checkOut",
    "currency",
    "hostFirstName",
    "highlight",
  ]) {
    const read = readString(details, key, path);
    if (!read.ok) return { ok: false, failure: read.failure };
    strings[key] = read.value;
  }

  for (const key of ["nightlyPrice", "totalPrice"]) {
    const read = readNumber(details, key, path, { min: Number.MIN_VALUE });
    if (!read.ok) return { ok: false, failure: read.failure };
  }

  const rating = readNumber(details, "guestRating", path, { min: 0, max: 5 });
  if (!rating.ok) return { ok: false, failure: rating.failure };

  const reviews = readNumber(details, "reviewCount", path, { min: 0 });
  if (!reviews.ok) return { ok: false, failure: reviews.failure };

  if (nightsBetween(strings.checkIn, strings.checkOut) === null) {
    return {
      ok: false,
      failure: {
        reason: "expected checkOut after checkIn",
        path: `${path}.checkOut`,
      },
    };
  }

  return null;
}

function parseExperience(details: Record<string, unknown>, path: string): ParseResult | null {
  for (const key of ["activityName", "category", "date", "startTime", "meetingPoint", "availability", "currency"]) {
    const read = readString(details, key, path);
    if (!read.ok) return { ok: false, failure: read.failure };
  }

  const host = readOptionalString(details, "hostFirstName", path);
  if (!host.ok) return { ok: false, failure: host.failure };

  const dayPlan = readOptionalDayPlan(details, "dayPlan", path);
  if (!dayPlan.ok) return { ok: false, failure: dayPlan.failure };

  const date = details.date;
  if (typeof date === "string" && parseIsoDate(date) === null) {
    return { ok: false, failure: { reason: "expected a real date", path: `${path}.date` } };
  }

  const startTime = details.startTime;
  if (typeof startTime === "string" && parseClockTime(startTime) === null) {
    return { ok: false, failure: { reason: "expected a 24-hour time", path: `${path}.startTime` } };
  }

  const duration = readNumber(details, "durationHours", path, { min: Number.MIN_VALUE });
  if (!duration.ok) return { ok: false, failure: duration.failure };

  for (const key of ["pricePerGuest", "totalPrice"]) {
    const read = readNumber(details, key, path, { min: Number.MIN_VALUE });
    if (!read.ok) return { ok: false, failure: read.failure };
  }

  const rating = readNumber(details, "guestRating", path, { min: 0, max: 5 });
  if (!rating.ok) return { ok: false, failure: rating.failure };

  return null;
}

function parseFood(details: Record<string, unknown>, path: string): ParseResult | null {
  for (const key of ["restaurantName", "cuisine", "neighbourhood", "meal", "priceLevel", "currency"]) {
    const read = readString(details, key, path);
    if (!read.ok) return { ok: false, failure: read.failure };
  }

  const note = readOptionalString(details, "bookingNote", path);
  if (!note.ok) return { ok: false, failure: note.failure };

  const description = readOptionalString(details, "description", path);
  if (!description.ok) return { ok: false, failure: description.failure };

  const cost = readNumber(details, "estimatedCost", path, { min: Number.MIN_VALUE });
  if (!cost.ok) return { ok: false, failure: cost.failure };

  const walk = readNumber(details, "walkMinutes", path, { min: 0 });
  if (!walk.ok) return { ok: false, failure: walk.failure };

  return null;
}

/* -------------------------------------------------------------------------- */
/* Response validator                                                         */
/* -------------------------------------------------------------------------- */

function parseBudget(value: unknown): { ok: true; value: BudgetSummary } | { ok: false; failure: ParseFailure } {
  const path = "response.budget";
  if (!isRecord(value)) return { ok: false, failure: { reason: "expected an object", path } };

  const reference = readNumber(value, "reference", path, { min: Number.MIN_VALUE });
  if (!reference.ok) return { ok: false, failure: reference.failure };

  const total = readNumber(value, "total", path, { min: 0 });
  if (!total.ok) return { ok: false, failure: total.failure };

  const currency = readString(value, "currency", path);
  if (!currency.ok) return { ok: false, failure: currency.failure };

  return {
    ok: true,
    value: { reference: reference.value, total: total.value, currency: currency.value },
  };
}

/**
 * Validates an unknown planner payload into a `PlannerResponse`.
 *
 * Enforces, in order: the envelope, the budget summary, exactly three cards,
 * and the stay → experience → food sequence the prototype depends on.
 */
export function parsePlannerResponse(value: unknown): ParseResult {
  if (!isRecord(value)) return fail("expected an object", "response");

  const requestId = readString(value, "requestId", "response");
  if (!requestId.ok) return { ok: false, failure: requestId.failure };

  const summary = readString(value, "summary", "response");
  if (!summary.ok) return { ok: false, failure: summary.failure };

  if (typeof value.mock !== "boolean") {
    return fail("expected a boolean", "response.mock");
  }

  const budget = parseBudget(value.budget);
  if (!budget.ok) return { ok: false, failure: budget.failure };

  const cards = value.cards;
  if (!Array.isArray(cards)) return fail("expected an array", "response.cards");
  if (cards.length !== CARD_ORDER.length) {
    return fail(`expected exactly ${CARD_ORDER.length} cards`, "response.cards");
  }

  const parsed: PlannerCard[] = [];

  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const path = `response.cards[${index}]`;
    if (!isRecord(card)) return fail("expected an object", path);

    const cardType = card.cardType;
    if (typeof cardType !== "string" || !CARD_ORDER.includes(cardType as CardType)) {
      return fail("expected a known cardType", `${path}.cardType`);
    }
    if (cardType !== CARD_ORDER[index]) {
      return fail(`expected "${CARD_ORDER[index]}" at position ${index}`, `${path}.cardType`);
    }

    const id = readString(card, "id", path);
    if (!id.ok) return { ok: false, failure: id.failure };

    const details = card.details;
    if (!isRecord(details)) return fail("expected an object", `${path}.details`);

    const detailsPath = `${path}.details`;
    const detailsFailure =
      cardType === "stay"
        ? parseStay(details, detailsPath)
        : cardType === "experience"
          ? parseExperience(details, detailsPath)
          : parseFood(details, detailsPath);

    if (detailsFailure) return detailsFailure;

    parsed.push(card as PlannerCard);
  }

  return {
    ok: true,
    response: {
      requestId: requestId.value,
      summary: summary.value,
      mock: value.mock,
      budget: budget.value,
      cards: parsed,
    },
  };
}

/**
 * Renders one card through its own component. Exhaustive by construction: the
 * `never` branch fails the type check if a card type is ever added without a
 * matching component.
 */
export function assertNeverCard(card: never): never {
  throw new Error(`Unhandled card type: ${JSON.stringify(card)}`);
}
