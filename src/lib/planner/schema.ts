/**
 * Response contract for the trip planner.
 *
 * This module is the boundary: everything the planner produces is `unknown`
 * until it passes `parsePlannerResponse`. The UI only ever renders validated
 * cards, so a malformed response can never reach a card component.
 */

export const CARD_TYPES = ["stay", "experience", "food"] as const;

export type CardType = (typeof CARD_TYPES)[number];

/** The success response always carries exactly three cards, in this order. */
export const CARD_ORDER: readonly CardType[] = ["stay", "experience", "food"];

export type StayDetails = {
  /** City and region the stay sits in, e.g. "East Austin, Texas". */
  destination: string;
  /** ISO date (YYYY-MM-DD) the guest checks in. */
  checkIn: string;
  /** ISO date (YYYY-MM-DD) the guest checks out. */
  checkOut: string;
  /** Nightly price in whole currency units. */
  nightlyPrice: number;
  /** ISO 4217 code, kept explicit so formatting never guesses. */
  currency: string;
  description: string;
  listingTitle: string;
};

export type DayPlan = {
  /** Day label as the guest would say it, e.g. "Saturday". */
  day: string;
  plan: string;
};

export type ExperienceDetails = {
  activityName: string;
  /** Human duration, e.g. "2 days". */
  duration: string;
  dayPlan: DayPlan[];
};

export type FoodDetails = {
  restaurantName: string;
  /** Cuisine and occasion, e.g. "Mexican, dinner". */
  mealType: string;
  /** Approximate cost, e.g. "$$ · about $40 a person". */
  priceRange: string;
  description: string;
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

function readNumber(
  source: Record<string, unknown>,
  key: string,
  path: string,
): { ok: true; value: number } | { ok: false; failure: ParseFailure } {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, failure: { reason: "expected a finite number", path: `${path}.${key}` } };
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
  for (const key of ["destination", "checkIn", "checkOut", "currency", "description", "listingTitle"]) {
    const read = readString(details, key, path);
    if (!read.ok) return { ok: false, failure: read.failure };
    strings[key] = read.value;
  }

  const price = readNumber(details, "nightlyPrice", path);
  if (!price.ok) return { ok: false, failure: price.failure };
  if (price.value <= 0) {
    return { ok: false, failure: { reason: "expected a positive price", path: `${path}.nightlyPrice` } };
  }

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
  for (const key of ["activityName", "duration"]) {
    const read = readString(details, key, path);
    if (!read.ok) return { ok: false, failure: read.failure };
  }

  const dayPlan = details.dayPlan;
  if (!Array.isArray(dayPlan) || dayPlan.length === 0) {
    return {
      ok: false,
      failure: { reason: "expected a non-empty dayPlan array", path: `${path}.dayPlan` },
    };
  }

  for (let index = 0; index < dayPlan.length; index += 1) {
    const entry = dayPlan[index];
    const entryPath = `${path}.dayPlan[${index}]`;
    if (!isRecord(entry)) {
      return { ok: false, failure: { reason: "expected an object", path: entryPath } };
    }
    for (const key of ["day", "plan"]) {
      const read = readString(entry, key, entryPath);
      if (!read.ok) return { ok: false, failure: read.failure };
    }
  }

  return null;
}

function parseFood(details: Record<string, unknown>, path: string): ParseResult | null {
  for (const key of ["restaurantName", "mealType", "priceRange", "description"]) {
    const read = readString(details, key, path);
    if (!read.ok) return { ok: false, failure: read.failure };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Response validator                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Validates an unknown planner payload into a `PlannerResponse`.
 *
 * Enforces, in order: the envelope, exactly three cards, and the
 * stay → experience → food sequence the prototype depends on.
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
