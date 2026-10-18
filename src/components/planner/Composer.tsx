"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

/** Long enough for a detailed weekend, short enough to stay a single message. */
export const MAX_REQUEST_LENGTH = 600;

const MAX_FIELD_HEIGHT = 128;

/**
 * The single input in the product.
 *
 * Enter sends, Shift+Enter adds a line, and IME composition never submits
 * mid-word. The field grows with the text up to four lines and then scrolls, so
 * a long prompt can never push the page into horizontal overflow.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, MAX_FIELD_HEIGHT)}px`;
  }, [value]);

  const canSubmit = value.trim().length > 0 && !busy;

  function setField(node: HTMLTextAreaElement | null) {
    fieldRef.current = node;
    inputRef.current = node;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSubmit) onSubmit();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <div className="flex items-end gap-2 rounded-card border border-line bg-linen p-2 pl-4 focus-within:border-line-strong">
        <label htmlFor="trip-request" className="sr-only">
          describe your weekend
        </label>
        <textarea
          id="trip-request"
          ref={setField}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={MAX_REQUEST_LENGTH}
          enterKeyHint="send"
          autoComplete="off"
          placeholder="a slow weekend in austin, one good hike, tacos…"
          className="min-h-10 flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-ink outline-none placeholder:text-ink-3 sm:text-body"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="send your trip request"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-surface transition-transform duration-[160ms] ease-out-strong active:scale-[0.97] disabled:bg-line-strong disabled:text-ink-3 motion-reduce:transition-none"
        >
          <ArrowUp size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
