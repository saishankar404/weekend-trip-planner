/**
 * One filler treatment, shared by all three cards.
 *
 * A field the content pack leaves blank is still rendered — as muted filler
 * text — so a required field is never silently dropped from a card. Every card
 * routes its values through this component, which is what keeps the treatment
 * identical across stay, experience and food.
 *
 * Nothing here invents a value: the filler says the data is absent, it does not
 * substitute a guess.
 */
export const MISSING_FIELD_TEXT = "not listed";

export function FieldValue({ value }: { value?: string | null }) {
  const text = value?.trim();
  if (!text) return <span className="text-ink-3">{MISSING_FIELD_TEXT}</span>;
  return <>{text}</>;
}
