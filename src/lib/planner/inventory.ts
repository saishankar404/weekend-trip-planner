/**
 * Trip inventory, transcribed verbatim from the content pack.
 *
 * Source: "Kyoto Weekend Prototype Content Pack.xlsx" — Stays (S1–S4),
 * Experiences (E1–E4), Food (F1–F4). Prices are USD for two guests.
 *
 * Two things in the pack are deliberate and are preserved here rather than
 * smoothed over:
 *
 *   - E3 is sold out, so it can never be selected.
 *   - E4 has no host and F2 has no booking note. Those cells are genuinely
 *     blank in the source, so they are optional here instead of being filled
 *     with invented text.
 *
 * The pack carries no photo URLs (image rights were not cleared), which is why
 * every card draws its own placeholder.
 *
 * The dates are the pack's own, read straight from its "Check-in Date",
 * "Check-out Date" and "Date" columns. They fall in April 2025 — in the past —
 * and they are shown exactly as written. The card's job is to prove that the
 * approved pack defines a fixed two-night weekend, so the dates on screen have
 * to come from the sheet rather than from the clock; nothing in the prototype
 * depends on them being in the future.
 */

/** Provenance, kept with the data so the numbers can always be traced back. */
export const SOURCE_NOTE =
  "Compiled by Priya Raman (PM, Search), 2025-03-07. Prices are USD for 2 guests, " +
  "against a $600 reference budget for the weekend. No photo URLs: image rights " +
  "for the prototype are not cleared.";

/** The pack's stated reference budget for the weekend. */
export const REFERENCE_BUDGET = 600;

export const CURRENCY = "USD";

/** The pack is a Kyoto weekend. */
export const CITY = "Kyoto";

export type StayOption = {
  id: string;
  listingTitle: string;
  propertyType: string;
  neighbourhood: string;
  /** ISO date, verbatim from the pack's "Check-in Date" column. */
  checkIn: string;
  /** ISO date, verbatim from the pack's "Check-out Date" column. */
  checkOut: string;
  nightlyPrice: number;
  /** "Total for 2 Nights (USD)". */
  totalPrice: number;
  guestRating: number;
  reviewCount: number;
  hostFirstName: string;
  highlight: string;
};

export type ExperienceOption = {
  id: string;
  activityName: string;
  category: string;
  /** Blank in the pack for E4. */
  hostFirstName?: string;
  /** ISO date, verbatim from the pack's "Date" column — the Saturday. */
  date: string;
  startTime: string;
  durationHours: number;
  pricePerGuest: number;
  totalPrice: number;
  guestRating: number;
  meetingPoint: string;
  availability: string;
};

export type FoodOption = {
  id: string;
  restaurantName: string;
  cuisine: string;
  neighbourhood: string;
  meal: string;
  priceLevel: string;
  /** "Est. Cost for 2 (USD)". */
  estimatedCost: number;
  walkMinutes: number;
  /** Blank in the pack for F2. */
  bookingNote?: string;
};

/** Every stay in the pack is the same fixed weekend: Fri 11 → Sun 13 April. */
export const STAYS: readonly StayOption[] = [
  {
    id: "S1",
    listingTitle: "Restored machiya townhouse near Gion",
    propertyType: "Entire townhouse",
    neighbourhood: "Gion",
    checkIn: "2025-04-11",
    checkOut: "2025-04-13",
    nightlyPrice: 168,
    totalPrice: 366,
    guestRating: 4.92,
    reviewCount: 214,
    hostFirstName: "Kenji",
    highlight: "Private garden and cedar soaking tub",
  },
  {
    id: "S2",
    listingTitle: "Quiet tatami room by the Kamo River",
    propertyType: "Private room in home",
    neighbourhood: "Shimogyo",
    checkIn: "2025-04-11",
    checkOut: "2025-04-13",
    nightlyPrice: 142,
    totalPrice: 312,
    guestRating: 4.88,
    reviewCount: 163,
    hostFirstName: "Yumi",
    highlight: "Riverside walk to Pontocho in 10 minutes",
  },
  {
    id: "S3",
    listingTitle: "Bright two-room flat off Sanjo Street",
    propertyType: "Entire apartment",
    neighbourhood: "Nakagyo",
    checkIn: "2025-04-11",
    checkOut: "2025-04-13",
    nightlyPrice: 112,
    totalPrice: 249,
    guestRating: 4.71,
    reviewCount: 412,
    hostFirstName: "Haruto",
    highlight: "Two blocks from Nishiki Market",
  },
  {
    id: "S4",
    listingTitle: "Design ryokan suite with garden view",
    propertyType: "Private room in ryokan",
    neighbourhood: "Higashiyama",
    checkIn: "2025-04-11",
    checkOut: "2025-04-13",
    nightlyPrice: 290,
    // 612 for the weekend: more than the whole reference budget on its own.
    totalPrice: 612,
    guestRating: 4.97,
    reviewCount: 38,
    hostFirstName: "Emi",
    highlight: "Kaiseki breakfast served in your room",
  },
];

/** Every activity in the pack runs on the Saturday, 12 April. */
export const EXPERIENCES: readonly ExperienceOption[] = [
  {
    id: "E1",
    activityName: "Tea ceremony in a 100-year-old machiya",
    category: "Culture",
    hostFirstName: "Mei",
    date: "2025-04-12",
    startTime: "10:30",
    durationHours: 2,
    pricePerGuest: 58,
    totalPrice: 116,
    guestRating: 4.96,
    meetingPoint: "Outside Gion-Shijo Station, exit 6",
    availability: "Spots open",
  },
  {
    id: "E2",
    activityName: "Nishiki Market tasting walk with a local cook",
    category: "Food & drink",
    hostFirstName: "Takumi",
    date: "2025-04-12",
    startTime: "11:00",
    durationHours: 3,
    pricePerGuest: 85,
    totalPrice: 170,
    guestRating: 4.91,
    meetingPoint: "Teramachi entrance to Nishiki Market",
    availability: "Spots open",
  },
  {
    id: "E3",
    activityName: "Dawn walk through Fushimi Inari's upper gates",
    category: "Nature",
    hostFirstName: "Ren",
    date: "2025-04-12",
    startTime: "06:00",
    durationHours: 2.5,
    pricePerGuest: 38,
    totalPrice: 76,
    guestRating: 4.99,
    meetingPoint: "Main torii gate, Fushimi Inari Taisha",
    // The highest-rated option in the pack, and the one that cannot be booked.
    availability: "Sold out",
  },
  {
    id: "E4",
    activityName: "Throw a tea bowl in a Kiyomizu pottery studio",
    category: "Craft",
    // No host listed in the pack.
    date: "2025-04-12",
    startTime: "14:00",
    durationHours: 1.5,
    pricePerGuest: 72,
    totalPrice: 144,
    guestRating: 4.84,
    meetingPoint: "Gojozaka bus stop, Higashiyama side",
    availability: "Spots open",
  },
];

export const FOOD: readonly FoodOption[] = [
  {
    id: "F1",
    restaurantName: "Menya Inoichi",
    cuisine: "Ramen",
    neighbourhood: "Gion",
    meal: "Dinner",
    priceLevel: "$",
    estimatedCost: 34,
    walkMinutes: 8,
    bookingNote: "No reservations - arrive before 18:00",
  },
  {
    id: "F2",
    restaurantName: "Sagano Yudofu-tei",
    cuisine: "Tofu",
    neighbourhood: "Arashiyama",
    meal: "Lunch",
    priceLevel: "$$",
    estimatedCost: 64,
    walkMinutes: 25,
    // No booking note in the pack.
  },
  {
    id: "F3",
    restaurantName: "Nishiki Tamago & Skewer Stall",
    cuisine: "Market street food",
    neighbourhood: "Nishiki Market",
    meal: "Snack stop",
    priceLevel: "$",
    estimatedCost: 30,
    walkMinutes: 14,
    bookingNote: "Cash only - most stalls close by 17:00",
  },
  {
    id: "F4",
    restaurantName: "Pontocho kaiseki counter",
    cuisine: "Kaiseki",
    neighbourhood: "Pontocho",
    meal: "Dinner",
    priceLevel: "$$$",
    estimatedCost: 180,
    walkMinutes: 6,
    bookingNote: "Book 3 days ahead",
  },
];
