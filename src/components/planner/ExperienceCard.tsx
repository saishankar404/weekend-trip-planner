import { Compass } from "@phosphor-icons/react";

import {
  formatDay,
  formatDuration,
  formatPrice,
  formatRating,
  formatTime,
  joinMeta,
} from "@/lib/planner/format";
import type { ExperienceCard as ExperienceCardData } from "@/lib/planner/schema";

import { CardImage } from "./CardImage";
import { FieldValue, MISSING_FIELD_TEXT } from "./FieldValue";
import { cardBody, cardFrame, cardLabel } from "./styles";

/**
 * Experience: one dated activity, read like a booking confirmation.
 *
 * Structure differs from the stay on purpose: the image becomes a tall strip
 * beside the content on desktop (stacked above it on mobile), and the facts are
 * a real `<dl>` with hairlines between rows. The activity name carries the 24px
 * step.
 *
 * The pack ships one activity with a start time rather than a day-by-day
 * itinerary, so the card shows what actually exists instead of inventing a
 * schedule around it. The day plan the Stage 1 card spec asks for is still
 * rendered, through the shared filler, rather than quietly dropped.
 */
export function ExperienceCard({ card }: { card: ExperienceCardData }) {
  const { details } = card;

  const rows: Array<{ key: string; label: string; value?: string }> = [
    {
      key: "when",
      label: "when",
      value: joinMeta([formatDay(details.date), formatTime(details.startTime)]),
    },
    { key: "lasts", label: "lasts", value: formatDuration(details.durationHours) },
    { key: "meets", label: "meets", value: details.meetingPoint },
  ];

  if (details.dayPlan && details.dayPlan.length > 0) {
    details.dayPlan.forEach((entry, index) => {
      rows.push({ key: `day-${index}`, label: entry.day, value: entry.plan });
    });
  } else {
    rows.push({ key: "day-plan", label: "day plan" });
  }

  return (
    <article className={`${cardFrame} sm:grid sm:grid-cols-[180px_1fr]`}>
      <CardImage
        tone="experience"
        icon={Compass}
        className="aspect-[16/9] w-full sm:aspect-auto sm:h-full"
      />

      <div className={cardBody}>
        <p className={`${cardLabel} text-exp`}>experience</p>

        <h2 className="mt-1 text-hero font-medium tracking-hero text-ink text-pretty">
          {details.activityName}
        </h2>

        <p className="mt-1 text-meta text-ink-2">
          {joinMeta([
            details.category,
            details.hostFirstName
              ? `hosted by ${details.hostFirstName}`
              : `host ${MISSING_FIELD_TEXT}`,
            formatRating(details.guestRating),
          ])}
        </p>

        <dl className="mt-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className={`schedule-row ${index === 0 ? "pb-3" : "py-3"}`}
            >
              <dt className={`${cardLabel} text-exp`}>{row.label}</dt>
              <dd className="mt-1 text-body text-ink-2 text-pretty">
                <FieldValue value={row.value} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-body font-medium tabular-nums text-ink">
            <FieldValue
              value={`${formatPrice(details.pricePerGuest, details.currency)} a guest`}
            />
          </p>
          <p className="text-meta text-ink-3">
            <FieldValue value={details.availability} />
          </p>
        </div>

        <p className="mt-1 text-meta tabular-nums text-ink-3">
          {formatPrice(details.totalPrice, details.currency)} for two
        </p>
      </div>
    </article>
  );
}
