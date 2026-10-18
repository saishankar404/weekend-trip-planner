import type { Icon } from "@phosphor-icons/react";

type Tone = "stay" | "experience" | "food";

const TONE_CLASSES: Record<Tone, string> = {
  stay: "bg-stay-tint text-stay",
  experience: "bg-exp-tint text-exp",
  food: "bg-food-tint text-food",
};

/**
 * Stand-in for a listing or venue photo.
 *
 * Drawn entirely in CSS so the prototype never depends on a remote asset, and
 * never shows a broken image. Decorative only: every value in a card is real
 * text, so nothing is lost when the image is absent.
 */
export function CardImage({
  tone,
  icon: IconComponent,
  className = "",
  pattern = true,
}: {
  tone: Tone;
  icon: Icon;
  className?: string;
  pattern?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center ${pattern ? "placeholder-grid" : ""} ${
        TONE_CLASSES[tone]
      } ${className}`}
    >
      <IconComponent size={20} weight="regular" className="opacity-45" />
    </div>
  );
}
