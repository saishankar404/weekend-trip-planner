/**
 * Choosing one weekend out of the pack.
 *
 * The pack lists four stays, four experiences and four food options against a
 * $600 reference budget, so the prototype has to pick rather than print the
 * sheet. The rules are deliberately simple and explainable, and every one of
 * them is visible in the result:
 *
 *   1. Only bookable options are considered. "Sold out" is excluded, and so is
 *      anything missing a required field — the pack leaves E4 without a host,
 *      and a hostless activity cannot be booked.
 *   2. The stay is the highest-rated option that still leaves enough of the
 *      budget to cover the cheapest remaining experience and meal.
 *   3. The experience is the highest-rated option that leaves enough for the
 *      cheapest remaining meal.
 *   4. The meal is the closest one to the stay that the money still covers,
 *      which is what makes the weekend walkable.
 *
 * Every step is guarded, so an over-tight budget returns null instead of an
 * incoherent plan. The UI never sees a partial weekend.
 */

import {
  CURRENCY,
  EXPERIENCES,
  FOOD,
  REFERENCE_BUDGET,
  STAYS,
  type ExperienceOption,
  type FoodOption,
  type StayOption,
} from "./inventory";

export type SelectedWeekend = {
  stay: StayOption;
  experience: ExperienceOption;
  food: FoodOption;
  /** What the three chosen options add up to. */
  total: number;
  /** The reference budget they were chosen against. */
  budget: number;
  currency: string;
};

/**
 * A sold-out option, or one the pack left incomplete, is not bookable. This is
 * the only place that decides what "bookable" means.
 */
export function isBookableExperience(option: ExperienceOption): boolean {
  return option.availability !== "Sold out" && Boolean(option.hostFirstName?.trim());
}

export function isBookableFood(option: FoodOption): boolean {
  return option.restaurantName.trim().length > 0 && option.estimatedCost > 0;
}

export function isBookableStay(option: StayOption): boolean {
  return option.listingTitle.trim().length > 0 && option.totalPrice > 0;
}

/** Highest rating wins; a cheaper total breaks a tie. */
function bestByRating<T extends { guestRating: number }>(
  options: readonly T[],
  cost: (option: T) => number,
): T | null {
  let best: T | null = null;
  for (const option of options) {
    if (best === null) {
      best = option;
      continue;
    }
    if (option.guestRating > best.guestRating) best = option;
    else if (option.guestRating === best.guestRating && cost(option) < cost(best)) best = option;
  }
  return best;
}

function cheapest<T>(options: readonly T[], cost: (option: T) => number): T | null {
  let best: T | null = null;
  for (const option of options) {
    if (best === null || cost(option) < cost(best)) best = option;
  }
  return best;
}

export function selectWeekend(
  budget: number = REFERENCE_BUDGET,
): SelectedWeekend | null {
  const stays = STAYS.filter(isBookableStay);
  const experiences = EXPERIENCES.filter(isBookableExperience);
  const meals = FOOD.filter(isBookableFood);

  if (stays.length === 0 || experiences.length === 0 || meals.length === 0) return null;

  const cheapestExperience = cheapest(experiences, (option) => option.totalPrice);
  const cheapestMeal = cheapest(meals, (option) => option.estimatedCost);
  if (!cheapestExperience || !cheapestMeal) return null;

  // 2. the stay, keeping enough back for the rest of the weekend
  const stayReserve = cheapestExperience.totalPrice + cheapestMeal.estimatedCost;
  const affordableStays = stays.filter((option) => option.totalPrice + stayReserve <= budget);
  const stay = bestByRating(affordableStays, (option) => option.totalPrice);
  if (!stay) return null;

  // 3. the experience, keeping enough back for a meal
  const afterStay = budget - stay.totalPrice;
  const affordableExperiences = experiences.filter(
    (option) => option.totalPrice + cheapestMeal.estimatedCost <= afterStay,
  );
  const experience = bestByRating(affordableExperiences, (option) => option.totalPrice);
  if (!experience) return null;

  // 4. the closest meal the remaining money still covers
  const afterExperience = afterStay - experience.totalPrice;
  const affordableMeals = meals.filter((option) => option.estimatedCost <= afterExperience);
  const food = affordableMeals.reduce<FoodOption | null>((best, option) => {
    if (best === null) return option;
    if (option.walkMinutes < best.walkMinutes) return option;
    if (option.walkMinutes > best.walkMinutes) return best;
    // Same walk: prefer the more ambitious table, then the cheaper one.
    if (option.priceLevel.length !== best.priceLevel.length) {
      return option.priceLevel.length > best.priceLevel.length ? option : best;
    }
    return option.estimatedCost < best.estimatedCost ? option : best;
  }, null);
  if (!food) return null;

  return {
    stay,
    experience,
    food,
    total: stay.totalPrice + experience.totalPrice + food.estimatedCost,
    budget,
    currency: CURRENCY,
  };
}
