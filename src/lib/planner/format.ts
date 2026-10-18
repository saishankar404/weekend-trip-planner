/**
 * Formatting helpers for validated planner values.
 *
 * Dates are parsed as UTC and formatted with an explicit locale and time zone
 * so the server-rendered markup and the client-rendered markup match.
 */

import { parseIsoDate } from "./schema";

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
