/**
 * Formatting helpers for validated planner values.
 *
 * Dates are parsed as UTC and formatted with an explicit locale and time zone
 * so the server-rendered markup and the client-rendered markup match.
 */

import { parseClockTime, parseIsoDate } from "./schema";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "2026-10-23" → "Fri, Oct 23". Falls back to the raw value if unparseable. */
export function formatDay(iso: string): string {
  const timestamp = parseIsoDate(iso);
  if (timestamp === null) return iso;
  return DATE_FORMATTER.format(timestamp);
}

export function formatNights(nights: number): string {
  return nights === 1 ? "1 night" : `${nights} nights`;
}

/** 186 + "USD" → "$186". */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount}`;
  }
}

/** 4.92 → "4.92". One decimal place looks sparse beside a review count. */
export function formatRating(rating: number): string {
  return rating.toFixed(2);
}

/** 214 → "214 reviews". */
export function formatReviews(count: number): string {
  const reviews = new Intl.NumberFormat("en-US").format(count);
  return count === 1 ? "1 review" : `${reviews} reviews`;
}

/** 2 → "2 hours"; 1.5 → "1.5 hours". */
export function formatDuration(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** "10:30" → "10:30 am"; "06:00" → "6:00 am". */
export function formatTime(value: string): string {
  const minutes = parseClockTime(value);
  if (minutes === null) return value;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 < 12 ? "am" : "pm";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Joins the parts that exist with a middot.
 *
 * Optional values are common in this data — the pack leaves a host and a
 * booking note blank — and this keeps a missing value from leaving a dangling
 * separator or an empty row behind.
 */
export function joinMeta(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}
