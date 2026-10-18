/**
 * The mock trip, assembled from the content pack.
 *
 * Nothing here is invented: the three cards are the output of `selectWeekend`,
 * and every value traces back to a row in the pack. `mock: true` travels with
 * the response and the UI labels it as a sample.
 */

import { CITY } from "./inventory";
import type { PlannerResponse } from "./schema";
import { selectWeekend } from "./select";

const CARD_IDS = {
  stay: (id: string) => `card_stay_${id.toLowerCase()}`,
  experience: (id: string) => `card_experience_${id.toLowerCase()}`,
  food: (id: string) => `card_food_${id.toLowerCase()}`,
} as const;

export function buildMockTrip(): PlannerResponse {
  const selected = selectWeekend();
  if (selected === null) {
    throw new Error("no weekend fits the reference budget");
  }

  const { stay, experience, food, total, budget, currency } = selected;

  return {
    requestId: "req_sample_kyoto",
    summary:
      `${stay.neighbourhood} for two nights, ${experience.activityName.toLowerCase()} ` +
      `on saturday, then ${food.cuisine.toLowerCase()} a short walk away.`,
    mock: true,
    budget: { reference: budget, total, currency },
    cards: [
      {
        cardType: "stay",
        id: CARD_IDS.stay(stay.id),
        details: {
          listingTitle: stay.listingTitle,
          propertyType: stay.propertyType,
          destination: `${stay.neighbourhood}, ${CITY}`,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          nightlyPrice: stay.nightlyPrice,
          totalPrice: stay.totalPrice,
          currency,
          guestRating: stay.guestRating,
          reviewCount: stay.reviewCount,
          hostFirstName: stay.hostFirstName,
          highlight: stay.highlight,
        },
      },
      {
        cardType: "experience",
        id: CARD_IDS.experience(experience.id),
        details: {
          activityName: experience.activityName,
          category: experience.category,
          date: experience.date,
          startTime: experience.startTime,
          durationHours: experience.durationHours,
          pricePerGuest: experience.pricePerGuest,
          totalPrice: experience.totalPrice,
          currency,
          guestRating: experience.guestRating,
          hostFirstName: experience.hostFirstName,
          meetingPoint: experience.meetingPoint,
          availability: experience.availability,
        },
      },
      {
        cardType: "food",
        id: CARD_IDS.food(food.id),
        details: {
          restaurantName: food.restaurantName,
          cuisine: food.cuisine,
          neighbourhood: food.neighbourhood,
          meal: food.meal,
          priceLevel: food.priceLevel,
          estimatedCost: food.estimatedCost,
          currency,
          walkMinutes: food.walkMinutes,
          bookingNote: food.bookingNote,
        },
      },
    ],
  };
}

/**
 * A deliberately broken payload, used by `?malformed=once` and by the manual
 * checks in the handoff notes. The food card is missing its cost, which is
 * exactly the kind of gap the boundary must catch before a card renders.
 */
export function buildMalformedResponse(): unknown {
  const good = buildMockTrip();

  const cards = good.cards.map((card) => {
    if (card.cardType !== "food") return card;
    const { estimatedCost: _droppedCost, ...incomplete } = card.details;
    return { ...card, details: incomplete };
  });

  return { ...good, cards };
}
