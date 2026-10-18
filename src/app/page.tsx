import { TripPlanner } from "@/components/planner/TripPlanner";

/**
 * One public route. The research hooks arrive as query parameters
 * (`?fail=once`, `?malformed=once`) and are read on the client, so this page
 * stays static.
 */
export default function Page() {
  return (
    <main>
      <TripPlanner />
    </main>
  );
}
