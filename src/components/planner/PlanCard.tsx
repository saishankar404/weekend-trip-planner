import { assertNeverCard, type PlannerCard } from "@/lib/planner/schema";

import { ExperienceCard } from "./ExperienceCard";
import { FoodCard } from "./FoodCard";
import { StayCard } from "./StayCard";

/**
 * Renders one validated card through its own component.
 *
 * The switch is exhaustive: adding a card type to the union without a case
 * fails the type check at `assertNeverCard`, so the renderer can never quietly
 * drop a card.
 */
export function PlanCard({ card }: { card: PlannerCard }) {
  switch (card.cardType) {
    case "stay":
      return <StayCard card={card} />;
    case "experience":
      return <ExperienceCard card={card} />;
    case "food":
      return <FoodCard card={card} />;
    default:
      return assertNeverCard(card);
  }
}
