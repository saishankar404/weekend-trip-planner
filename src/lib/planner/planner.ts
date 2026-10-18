/**
 * The mock planner.
 *
 * There is no model and no backend here. `planTrip` stands in for the planned
 * service: it waits, then returns a payload that is validated at the boundary
 * before any component can see it. Swapping in a real call later means
 * replacing the body of this one function.
 */

import { MALFORMED_RESPONSE, MOCK_TRIP } from "./fixtures";
import { parsePlannerResponse, type PlannerResponse } from "./schema";

export type PlanFailure = {
  kind: "forced" | "malformed" | "unknown";
  /** Why the plan could not be produced. Shown only in research notes. */
  reason: string;
  /** Offending field when the boundary rejected a payload. */
  path?: string;
};

export type PlanOutcome =
  | { ok: true; response: PlannerResponse }
  | { ok: false; failure: PlanFailure };

export type PlanOptions = {
  /**
   * Simulate a failed request without calling the service. Used by the
   * `?fail=once` research hook.
   */
  forceFailure?: boolean;
  /**
   * Return a payload that violates the contract, so the boundary rejects it.
   * Used by the `?malformed=once` research hook.
   */
  malformed?: boolean;
};

/**
 * Concise stage copy for the thinking state. Sequential, factual, and short
 * enough to read in the time the request takes.
 */
export const THINKING_STAGES = [
  "reading your weekend",
  "finding a place to stay",
  "putting your weekend together",
] as const;

/** Also read by the shell so the thinking state and the wait stay in step. */
export const STAGE_DURATION_MS = 460;

export async function planTrip(
  request: string,
  options: PlanOptions = {},
): Promise<PlanOutcome> {
  // Defensive: the composer already blocks empty submissions, but the planner
  // refuses to invent a weekend from nothing.
  if (request.trim().length === 0) {
    return { ok: false, failure: { kind: "unknown", reason: "empty request" } };
  }

  if (options.forceFailure) {
    return {
      ok: false,
      failure: { kind: "forced", reason: "forced failure for the research scenario" },
    };
  }

  const payload: unknown = options.malformed ? MALFORMED_RESPONSE : MOCK_TRIP;
  const parsed = parsePlannerResponse(payload);

  if (!parsed.ok) {
    return {
      ok: false,
      failure: {
        kind: "malformed",
        reason: parsed.failure.reason,
        path: parsed.failure.path,
      },
    };
  }

  return { ok: true, response: parsed.response };
}
