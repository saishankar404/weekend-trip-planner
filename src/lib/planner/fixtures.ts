/**
 * Mock trip data.
 *
 * Every date, price and sentence the prototype renders lives here, so the
 * scenario can be swapped without touching a UI component. Nothing in this
 * file is real inventory: `mock: true` travels with the response and the UI
 * labels it as a sample.
 *
 * The scenario: one weekend in East Austin, Friday to Sunday.
 */

import type { PlannerResponse } from "./schema";

export const MOCK_TRIP: PlannerResponse = {
  requestId: "req_sample_austin",
  summary: "a weekend built around one long walk and one long dinner.",
  mock: true,
  cards: [
    {
      cardType: "stay",
      id: "card_stay_east_austin",
      details: {
        destination: "East Austin, Texas",
        checkIn: "2026-10-23",
        checkOut: "2026-10-25",
        nightlyPrice: 186,
        currency: "USD",
        listingTitle: "Sunlit bungalow with a screened porch",
        description:
          "A quiet street ten minutes from the river. Big windows, a real kitchen, and a porch built for slow mornings.",
      },
    },
    {
      cardType: "experience",
      id: "card_experience_barton_springs",
      details: {
        activityName: "South Congress to Barton Springs",
        duration: "2 days · 5 stops",
        dayPlan: [
          {
            day: "Saturday",
            plan: "Coffee and record shops on South Congress, a swim at Barton Springs, then the bats at dusk.",
          },
          {
            day: "Sunday",
            plan: "An early Greenbelt hike before the heat, a late brunch, then a slow afternoon back at the stay.",
          },
        ],
      },
    },
    {
      cardType: "food",
      id: "card_food_licias",
      details: {
        restaurantName: "Licha's Cantina",
        mealType: "Mexican, dinner",
        priceRange: "$$ · about $40 a person",
        description:
          "Family-run and loud in the good way. Order the brisket tacos and a mezcal margarita.",
      },
    },
  ],
};

/**
 * A deliberately broken payload, used by `?malformed=once` and by the manual
 * checks in the handoff notes. It fails because the food card is missing a
 * required field, which is exactly the failure the boundary must catch.
 */
export const MALFORMED_RESPONSE: unknown = {
  ...MOCK_TRIP,
  cards: [
    MOCK_TRIP.cards[0],
    MOCK_TRIP.cards[1],
    {
      cardType: "food",
      id: "card_food_licias",
      details: {
        restaurantName: "Licha's Cantina",
        mealType: "Mexican, dinner",
        description: "Family-run and loud in the good way.",
      },
    },
  ],
};
