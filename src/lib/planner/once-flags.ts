const ONCE_PREFIX = "trip-planner:once:";

/** In-memory fallback for private-mode browsers where storage throws. */
const consumed = new Set<string>();

/**
 * Consumes a one-shot research flag.
 *
 * Returns true the first time per tab and false afterwards, so a query
 * parameter such as `?fail=once` can never produce an endless failure loop.
 * Session storage is the source of truth; the in-memory set keeps the
 * guarantee when storage is unavailable.
 */
export function consumeOnce(key: string): boolean {
  if (typeof window === "undefined") return false;

  const storageKey = `${ONCE_PREFIX}${key}`;
  if (consumed.has(storageKey)) return false;

  let alreadyConsumed = false;
  try {
    alreadyConsumed = window.sessionStorage.getItem(storageKey) === "1";
  } catch {
    alreadyConsumed = false;
  }

  if (alreadyConsumed) {
    consumed.add(storageKey);
    return false;
  }

  consumed.add(storageKey);
  try {
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Storage is full or blocked; the in-memory set still holds for this tab.
  }
  return true;
}
