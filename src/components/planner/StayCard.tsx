import { House, MapPin } from "@phosphor-icons/react";

import {
  formatDay,
  formatNights,
  formatPrice,
  formatRating,
  formatReviews,
  joinMeta,
} from "@/lib/planner/format";
import { nightsBetween, type StayCard as StayCardData } from "@/lib/planner/schema";

import { CardImage } from "./CardImage";
import { FieldValue, MISSING_FIELD_TEXT } from "./FieldValue";
import { cardBody, cardFrame, cardLabel, metaIcon } from "./styles";

/**
 * Stay: a place, read top to bottom like a listing.
 *
 * Hierarchy is deliberate. The dates are the decision a guest actually makes,
 * so they hold the only 24px step on the card and the nights sit beside them in
 * coral. Everything else steps down through weight and the ink ramp.
 *
 * Every field on this card — title, neighbourhood, dates, nightly price and
 * highlight — is a column the content pack actually ships.
 */
export function StayCard({ card }: { card: StayCardData }) {
  const { details } = card;
  const nights = nightsBetween(details.checkIn, details.checkOut) ?? 0;

  return (
    <article className={cardFrame}>
      <CardImage tone="stay" icon={House} className="aspect-[2/1] w-full" />

      <div className={cardBody}>
        <p className={`${cardLabel} text-stay`}>stay</p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <DateBlock label="check in" value={formatDay(details.checkIn)} />
          <p className="text-meta font-medium tabular-nums text-stay sm:pb-[3px]">
            <FieldValue value={nights > 0 ? formatNights(nights) : undefined} />
          </p>
          <DateBlock label="check out" value={formatDay(details.checkOut)} alignEnd />
        </div>

        <h2 className="mt-4 text-body font-medium text-ink text-pretty">
          <FieldValue value={details.listingTitle} />
        </h2>

        <p className="mt-1 flex items-center gap-1.5 text-meta text-ink-2">
          <MapPin size={14} weight="regular" className={metaIcon} aria-hidden="true" />
          <FieldValue value={details.destination} />
        </p>

        <p className="mt-2 text-meta text-ink-3">
          <FieldValue
            value={joinMeta([
              details.propertyType,
              details.hostFirstName
                ? `hosted by ${details.hostFirstName}`
                : `host ${MISSING_FIELD_TEXT}`,
            ])}
          />
        </p>

        <p className="mt-1 text-meta tabular-nums text-ink-3">
          <FieldValue
            value={joinMeta([
              formatRating(details.guestRating),
              formatReviews(details.reviewCount),
            ])}
          />
        </p>

        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-body font-medium tabular-nums text-ink">
            <FieldValue value={formatPrice(details.nightlyPrice, details.currency)} />
          </span>
          <span className="text-meta text-ink-3">a night</span>
        </p>

        <p className="mt-1 text-meta tabular-nums text-ink-3">
          <FieldValue
            value={`${formatPrice(details.totalPrice, details.currency)} for ${formatNights(nights)}`}
          />
        </p>

        <p className="mt-3 text-body text-ink-2 text-pretty">
          <FieldValue value={details.highlight} />
        </p>
      </div>
    </article>
  );
}

function DateBlock({
  label,
  value,
  alignEnd = false,
}: {
  label: string;
  value: string;
  alignEnd?: boolean;
}) {
  return (
    <div className={alignEnd ? "sm:text-right" : undefined}>
      <p className="text-caption font-medium text-ink-3">{label}</p>
      <p className="text-hero font-medium tabular-nums tracking-hero text-ink">
        <FieldValue value={value} />
      </p>
    </div>
  );
}
