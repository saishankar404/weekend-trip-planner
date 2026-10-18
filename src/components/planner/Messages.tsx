import { formatPrice } from "@/lib/planner/format";
import type { BudgetSummary } from "@/lib/planner/schema";

/**
 * The guest's own message. Right-aligned, linen, one corner tightened so it
 * reads as a sent bubble rather than a card.
 */
export function GuestMessage({ text }: { text: string }) {
  return (
    <div className="rise-in flex justify-end">
      <p className="max-w-[85%] rounded-card rounded-br-nav bg-linen px-4 py-3 text-body text-ink [overflow-wrap:anywhere] whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

/**
 * The planner's answer: one short line, what it costs against the reference
 * budget, then the three cards.
 *
 * The mock label is not decoration. Every listing, price and activity in this
 * prototype comes from a sample content pack, and the guest has to know that
 * before reading a price.
 */
export function PlanMessage({
  summary,
  mock,
  budget,
  children,
}: {
  summary: string;
  mock: boolean;
  budget: BudgetSummary;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="rise-in rise-in-1 max-w-[46ch] text-body text-ink-2 text-pretty">
        {summary}
      </p>

      <p className="mt-1 text-meta tabular-nums text-ink-2">
        {formatPrice(budget.total, budget.currency)} of your{" "}
        {formatPrice(budget.reference, budget.currency)} weekend
      </p>

      {mock ? (
        <p className="mt-1 text-caption text-ink-3">sample plan · mock listings and prices</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/**
 * The thinking state: three quiet dots and one line of stage copy.
 *
 * No spinner, no percentage, no pulsing colour. Movement is limited to opacity
 * and only runs when the guest has not asked for reduced motion.
 */
export function ThinkingIndicator({ stage }: { stage: string }) {
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      <span className="flex items-center gap-1">
        <span className="dot-breathe size-1.5 rounded-full bg-ink-3" />
        <span className="dot-breathe dot-breathe-2 size-1.5 rounded-full bg-ink-3" />
        <span className="dot-breathe dot-breathe-3 size-1.5 rounded-full bg-ink-3" />
      </span>
      <p className="text-meta text-ink-2">{stage}</p>
    </div>
  );
}

/**
 * The failure state, inside the conversation.
 *
 * The request is still in the transcript above this message, so "try again"
 * resubmits rather than asking the guest to retype anything.
 */
export function ErrorNotice({
  onRetry,
  onStartOver,
  busy,
  retryButtonRef,
}: {
  onRetry: () => void;
  onStartOver: () => void;
  busy: boolean;
  retryButtonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <div
      role="alert"
      className="rise-in rounded-card border border-line-strong bg-linen p-4"
    >
      <p className="text-body font-medium text-ink">
        i couldn&rsquo;t put your weekend together just now.
      </p>
      <p className="mt-2 text-body text-ink-2 text-pretty">
        your request is still here. try again, or start a fresh plan.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          ref={retryButtonRef}
          type="button"
          onClick={onRetry}
          disabled={busy}
          className="h-10 rounded-full bg-ink px-5 text-body font-medium text-surface transition-transform duration-[160ms] ease-out-strong active:scale-[0.97] disabled:opacity-45 motion-reduce:transition-none"
        >
          try again
        </button>
        <button
          type="button"
          onClick={onStartOver}
          disabled={busy}
          className="h-10 rounded-full border border-line-strong px-5 text-body font-medium text-ink transition-colors duration-[160ms] hover:bg-surface disabled:opacity-45"
        >
          start over
        </button>
      </div>
    </div>
  );
}
