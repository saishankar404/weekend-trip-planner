import { ForkKnife } from "@phosphor-icons/react";

import type { FoodCard as FoodCardData } from "@/lib/planner/schema";

import { CardImage } from "./CardImage";
import { cardBody, cardFrame, cardLabel } from "./styles";

/**
 * Food: a detour, not a destination.
 *
 * Structurally the smallest of the three, and deliberately a horizontal row: a
 * circular image on the right, name and meal type on the left, the cost and the
 * description below. The restaurant name carries the 24px step.
 */
export function FoodCard({ card }: { card: FoodCardData }) {
  const { details } = card;

  return (
    <article className={cardFrame}>
      <div className={cardBody}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={`${cardLabel} text-food`}>food</p>
            <h2 className="mt-1 text-hero font-medium tracking-hero text-ink text-pretty">
              {details.restaurantName}
            </h2>
            <p className="mt-1 text-meta text-ink-2">{details.mealType}</p>
          </div>

          <CardImage
            tone="food"
            icon={ForkKnife}
            pattern={false}
            className="size-[72px] shrink-0 rounded-full sm:size-[88px]"
          />
        </div>

        <p className="mt-4 text-body font-medium tabular-nums text-ink">
          {details.priceRange}
        </p>
        <p className="mt-2 text-body text-ink-2 text-pretty">{details.description}</p>
      </div>
    </article>
  );
}
