import { ForkKnife } from "@phosphor-icons/react";

import { formatPrice, joinMeta } from "@/lib/planner/format";
import type { FoodCard as FoodCardData } from "@/lib/planner/schema";

import { CardImage } from "./CardImage";
import { FieldValue } from "./FieldValue";
import { cardBody, cardFrame, cardLabel } from "./styles";

/**
 * Food: a detour, not a destination.
 *
 * Structurally the smallest of the three, and deliberately a horizontal row: a
 * circular image on the right, place and cuisine on the left, cost below. The
 * restaurant name carries the 24px step.
 *
 * The content pack ships no description for any food row, and the Stage 1 card
 * spec asks for one, so the field is filled rather than dropped. The booking
 * note is optional in the pack for the same reason.
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
              <FieldValue value={joinMeta([details.cuisine, details.meal])} />
            </p>
            <p className="mt-1 text-meta text-ink-3">
              <FieldValue
                value={joinMeta([
                  details.neighbourhood,
                  details.walkMinutes === undefined
                    ? undefined
                    : `${details.walkMinutes} min walk`,
                ])}
              />
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
          <FieldValue
            value={joinMeta([
              details.priceLevel,
              `about ${formatPrice(details.estimatedCost, details.currency)} for two`,
            ])}
          />
        </p>

        <p className="mt-2 text-body text-ink-2 text-pretty">
          <FieldValue value={details.description} />
        </p>

        <p className="mt-2 text-meta text-ink-3">
          <FieldValue value={details.bookingNote} />
        </p>
      </div>
    </article>
  );
}
