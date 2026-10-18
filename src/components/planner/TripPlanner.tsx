"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { STAGE_DURATION_MS, THINKING_STAGES, planTrip } from "@/lib/planner/planner";
import { consumeOnce } from "@/lib/planner/once-flags";
import { readResearchFlags } from "@/lib/planner/research-flags";
import type { PlannerResponse } from "@/lib/planner/schema";

import { Composer } from "./Composer";
import { ErrorNotice, GuestMessage, PlanMessage, ThinkingIndicator } from "./Messages";
import { PlanCard } from "./PlanCard";

const EXAMPLE_PROMPT = "a slow weekend in austin with one good hike and tacos";

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

type Entry =
  | { kind: "guest"; id: string; text: string }
  | { kind: "plan"; id: string; response: PlannerResponse }
  | { kind: "error"; id: string; request: string };

type State = {
  entries: Entry[];
  /** The request in flight, or null when nothing is pending. */
  pending: string | null;
  stage: number;
};

type Action =
  | { type: "submit"; text: string }
  | { type: "retry"; request: string }
  | { type: "advance" }
  | { type: "resolve"; response: PlannerResponse }
  | { type: "reject" }
  | { type: "reset" };

const INITIAL_STATE: State = { entries: [], pending: null, stage: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "submit": {
      // A second submission while one is in flight is ignored rather than
      // queued: the composer is disabled for the same reason.
      if (state.pending !== null) return state;
      const text = action.text.trim();
      if (text.length === 0) return state;
      return {
        pending: text,
        stage: 0,
        entries: [...state.entries, { kind: "guest", id: makeId("guest"), text }],
      };
    }

    case "retry": {
      if (state.pending !== null) return state;
      return {
        pending: action.request,
        stage: 0,
        // The failed notice is replaced by the retry, so the guest does not
        // have to read the same error twice and the transcript stays honest.
        entries: state.entries.filter(
          (entry) => !(entry.kind === "error" && entry.request === action.request),
        ),
      };
    }

    case "advance":
      return state.pending === null ? state : { ...state, stage: state.stage + 1 };

    case "resolve":
      return {
        pending: null,
        stage: 0,
        entries: [
          ...state.entries,
          { kind: "plan", id: makeId("plan"), response: action.response },
        ],
      };

    case "reject": {
      if (state.pending === null) return state;
      return {
        pending: null,
        stage: 0,
        entries: [
          ...state.entries,
          { kind: "error", id: makeId("error"), request: state.pending },
        ],
      };
    }

    case "reset":
      return INITIAL_STATE;
  }
}

/**
 * The whole prototype: one column, one composer, one conversation.
 *
 * The `?fail=once` and `?malformed=once` research hooks are read from the URL
 * when a request is made, and each arms a single forced outcome per browser
 * tab, so the scenario is repeatable on demand and can never loop.
 */
export function TripPlanner() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [value, setValue] = useState("");
  const [focusRequest, setFocusRequest] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const retryRef = useRef<HTMLButtonElement | null>(null);

  const busy = state.pending !== null;
  const lastEntry = state.entries.at(-1) ?? null;
  const started = state.entries.length > 0;

  /* One tick of the thinking state per pass, ending in success or failure. */
  useEffect(() => {
    const pending = state.pending;
    if (pending === null) return;

    const isFinalStage = state.stage >= THINKING_STAGES.length - 1;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!isFinalStage) {
        dispatch({ type: "advance" });
        return;
      }

      void (async () => {
        // Each research flag is read from the URL when the request is made, and
        // consumed once per tab, so a retry is never trapped in the failure.
        const flags = readResearchFlags();
        const forceFailure = flags.failOnce && consumeOnce("fail");
        const malformed = flags.malformedOnce && consumeOnce("malformed");
        const outcome = await planTrip(pending, { forceFailure, malformed });
        if (cancelled) return;
        dispatch(
          outcome.ok ? { type: "resolve", response: outcome.response } : { type: "reject" },
        );
      })();
    }, STAGE_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.pending, state.stage]);

  /* Keep the newest message in view. */
  useEffect(() => {
    const region = scrollRef.current;
    if (!region) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    region.scrollTo({ top: region.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [state.entries.length, state.pending]);

  /* On failure, put focus on the recovery action rather than stranding it. */
  useEffect(() => {
    if (lastEntry?.kind === "error") retryRef.current?.focus();
  }, [lastEntry]);

  const submit = useCallback(
    (text: string) => {
      if (text.trim().length === 0 || busy) return;
      dispatch({ type: "submit", text });
      setValue("");
    },
    [busy],
  );

  const startOver = useCallback(() => {
    dispatch({ type: "reset" });
    setValue("");
    // Focus is restored in an effect rather than a rAF callback: animation
    // frames do not run while the document is hidden.
    setFocusRequest((request) => request + 1);
  }, []);

  /* Returning focus to the composer is part of "start over". */
  useEffect(() => {
    if (focusRequest === 0) return;
    inputRef.current?.focus();
  }, [focusRequest]);

  const announcement = useMemo(() => {
    if (busy) return "putting your weekend together";
    if (lastEntry?.kind === "error") {
      return "your plan didn't come through. try again, or start over.";
    }
    if (lastEntry?.kind === "plan") {
      return "your plan is ready: a stay, an experience, and somewhere to eat.";
    }
    return "";
  }, [busy, lastEntry]);

  const currentStage = THINKING_STAGES[Math.min(state.stage, THINKING_STAGES.length - 1)];

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
        <h1 className="font-display text-body font-medium text-ink">
          weekend trip planner
        </h1>

        {started ? (
          <button
            type="button"
            onClick={startOver}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-nav px-2 py-1 text-meta font-medium text-ink-2 transition-colors duration-[160ms] hover:text-ink disabled:opacity-45"
          >
            <ArrowCounterClockwise size={14} weight="regular" aria-hidden="true" />
            new plan
          </button>
        ) : null}
      </header>

      <div
        ref={scrollRef}
        aria-busy={busy}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[40rem] flex-col px-4 py-6 sm:px-6">
          {started ? (
            <div className="mt-auto flex flex-col gap-6">
              {state.entries.map((entry) => {
                if (entry.kind === "guest") {
                  return <GuestMessage key={entry.id} text={entry.text} />;
                }

                if (entry.kind === "plan") {
                  return (
                    <PlanMessage
                      key={entry.id}
                      summary={entry.response.summary}
                      mock={entry.response.mock}
                    >
                      {entry.response.cards.map((card, index) => (
                        <div key={card.id} className={`rise-in rise-in-${index + 1}`}>
                          <PlanCard card={card} />
                        </div>
                      ))}
                    </PlanMessage>
                  );
                }

                return (
                  <ErrorNotice
                    key={entry.id}
                    busy={busy}
                    retryButtonRef={retryRef}
                    onRetry={() => dispatch({ type: "retry", request: entry.request })}
                    onStartOver={startOver}
                  />
                );
              })}

              {busy ? <ThinkingIndicator stage={currentStage} /> : null}
            </div>
          ) : (
            <div className="my-auto py-8">
              <p className="font-display text-hero font-medium tracking-hero text-ink text-balance">
                describe a weekend, get a plan
              </p>
              <p className="mt-3 max-w-[46ch] text-body text-ink-2 text-pretty">
                say where you&rsquo;re going and what kind of time you want. you&rsquo;ll get a
                place to stay, two days to fill, and somewhere to eat.
              </p>
              <p className="mt-4 text-caption text-ink-3">
                sample listings and prices, not a real booking
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-[40rem] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {!started ? (
            <button
              type="button"
              onClick={() => {
                setValue(EXAMPLE_PROMPT);
                inputRef.current?.focus();
              }}
              className="mb-3 flex w-full items-start gap-2 rounded-card border border-line px-3.5 py-2.5 text-left transition-colors duration-[160ms] hover:border-line-strong"
            >
              <span className="text-caption font-medium text-ink-3">example</span>
              <span className="text-meta text-ink-2">{EXAMPLE_PROMPT}</span>
            </button>
          ) : null}

          <Composer
            value={value}
            onChange={setValue}
            onSubmit={() => submit(value)}
            busy={busy}
            inputRef={inputRef}
          />
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
