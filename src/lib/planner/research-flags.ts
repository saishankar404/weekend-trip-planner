/**
 * Research hooks, read from the URL when a request is actually made.
 *
 * Reading them at request time instead of during render keeps the page static
 * and means a flag always belongs to the submission it was opened for.
 *
 *   ?fail=once       the first request in this tab fails, then recovers
 *   ?malformed=once  the first response violates the contract, and is rejected
 */
export type ResearchFlags = {
  failOnce: boolean;
  malformedOnce: boolean;
};

const NO_FLAGS: ResearchFlags = { failOnce: false, malformedOnce: false };

export function readResearchFlags(): ResearchFlags {
  if (typeof window === "undefined") return NO_FLAGS;

  const params = new URLSearchParams(window.location.search);
  return {
    failOnce: params.get("fail") === "once",
    malformedOnce: params.get("malformed") === "once",
  };
}
