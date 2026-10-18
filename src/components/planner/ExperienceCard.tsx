import { Clock, Compass } from "@phosphor-icons/react";

import type { ExperienceCard as ExperienceCardData } from "@/lib/planner/schema";

import { CardImage } from "./CardImage";
import { cardBody, cardFrame, cardLabel, metaIcon } from "./styles";

/**
 * Experience: a small itinerary, read like a timeline.
 *
 * Structure differs from the stay on purpose: the image becomes a tall strip
 * beside the content on desktop (stacked above it on mobile), and the two days
 * are set as a real `<dl>` with hairlines between rows. The activity title
 * carries the 24px step.
 */
export function ExperienceCard({ card }: { card: ExperienceCardData }) {
  const { details } = card;

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

        <p className="mt-1 flex items-center gap-1.5 text-meta text-ink-2">
          <Clock size={14} weight="regular" className={metaIcon} aria-hidden="true" />
          {details.duration}
        </p>

        <dl className="mt-3">
          {details.dayPlan.map((entry, index) => (
            <div
              key={`${entry.day}-${index}`}
              className={`schedule-row ${index === 0 ? "pb-3" : "py-3"}`}
            >
              <dt className={`${cardLabel} text-exp`}>{entry.day}</dt>
              <dd className="mt-1 text-body text-ink-2 text-pretty">{entry.plan}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
