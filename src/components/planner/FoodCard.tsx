import { ForkKnife } from "@phosphor-icons/react";

import { formatPrice, joinMeta } from "@/lib/planner/format";
import type { FoodCard as FoodCardData } from "@/lib/planner/schema";

import { CardImage } from "./CardImage";
import { cardBody, cardFrame, cardLabel } from "./styles";

/**
 * Food: a detour, not a destination.
 *
 * Structurally the smallest of the three, and deliberately a horizontal row: a
 * circular image on the right, place and cuisine on the left, cost below. The
 * restaurant name carries the 24px step.
 *
 * The pack leaves F2 without a booking note, so that line is optional and the
 * card closes cleanly without it.
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
            <p className="mt-1 text-meta text-ink-2">
              {joinMeta([details.cuisine, details.meal])}
            </p>
            <p className="mt-1 text-meta text-ink-3">
              {joinMeta([details.neighbourhood, `${details.walkMinutes} min walk`])}
            </p>
          </div>

          <CardImage
            tone="food"
            icon={ForkKnife}
            pattern={false}
            className="size-[72px] shrink-0 rounded-full sm:size-[88px]"
          />
        </div>

        <p className="mt-4 text-body font-medium tabular-nums text-ink">
          {joinMeta([
            details.priceLevel,
            `about ${formatPrice(details.estimatedCost, details.currency)} for two`,
          ])}
        </p>

        {details.bookingNote ? (
          <p className="mt-2 text-body text-ink-2 text-pretty">{details.bookingNote}</p>
        ) : null}
      </div>
    </article>
  );
}
