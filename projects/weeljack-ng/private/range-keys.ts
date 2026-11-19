import { DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * What {@link _rangeKeys} reads and calls. Every reader is a function, so a wrapper passes a signal
 * or a `computed` and the keys always see the current value.
 *
 * @docs-private
 */
export interface _RangeKeysOptions {
  /** The lowest value. */
  readonly min: () => number;
  /** The highest value. */
  readonly max: () => number;
  /** The grid the keys move on, from `min`. A step of 0 counts as 1. */
  readonly step: () => number;
  /** The value now, as shown: a wrapper maps its own `null` to `min` here. */
  readonly value: () => number;
  /** While true the keys change nothing (disabled or read-only). Defaults to never. */
  readonly inert?: () => boolean;
  /** The element whose keys are handled: the focusable part inside the host. */
  readonly part: () => unknown;
  /** Applies the next value, already clamped to [`min`, `max`] and on the step grid. */
  readonly write: (next: number, event: KeyboardEvent) => void;
}

/** Page Up and Page Down move this many steps. */
const PAGE = 10;
const MOVES = new Map([
  ['ArrowRight', 1],
  ['ArrowUp', 1],
  ['ArrowLeft', -1],
  ['ArrowDown', -1],
  ['PageUp', PAGE],
  ['PageDown', -PAGE],
]);

/** The value `key` moves to, or `undefined` for a key the map does not know. */
function nextValue(key: string, options: _RangeKeysOptions): number | undefined {
  const min = options.min();
  const max = options.max();
  if (key === 'Home') return min;
  if (key === 'End') return max;
  const moves = MOVES.get(key);
  if (moves === undefined) return undefined;
  const step = options.step() || 1;
  // Where the value sits on the grid. A value between two grid points steps to the next one in
  // the direction of the key; the rounding keeps `0.1 * 3` from landing just off a point.
  const at = +((options.value() - min) / step).toFixed(9);
  const point = (moves > 0 ? Math.floor(at) : Math.ceil(at)) + moves;
  return Math.min(max, Math.max(min, +(min + point * step).toFixed(9)));
}

/**
 * The key map of a value range, shared by the slider, the knob and the colour picker's hue
 * (w2-forms-choice FR-7). Optimus's own handlers disagree with each other and with `step`, so a
 * wrapper turns them off for these keys:
 *
 * | Key | Effect |
 * |---|---|
 * | Arrow Right, Arrow Up | + `step` |
 * | Arrow Left, Arrow Down | − `step` |
 * | Page Up, Page Down | ± 10 × `step` |
 * | Home, End | `min`, `max` |
 *
 * It registers one capture-phase `keydown` listener on the wrapper's host, added in
 * `afterNextRender` and removed when the host is destroyed, so it never runs on the server. A key
 * of the map whose target is `part()` is stopped before it reaches Optimus and is not scrolled
 * (`preventDefault` and `stopPropagation`); `write` then gets the next value, unless `inert`.
 * Values clamp to the range and snap to the grid from `min`; the orientation never changes the map.
 * Keys with Alt, Ctrl or Meta are left alone, so the browser's Alt+Arrow history keys still work.
 * Must run in an injection context (a field initialiser):
 *
 * ```ts
 * _rangeKeys({
 *   min: this.low,
 *   max: this.high,
 *   step: this.step,
 *   value: () => this.value() ?? this.low(),
 *   inert: this.isDisabled,
 *   part: () => this.inner()?.sliderHandle?.nativeElement,
 *   write: (next, event) => this.inner()?.updateValue(next, event),
 * });
 * ```
 *
 * @docs-private
 */
export function _rangeKeys(options: _RangeKeysOptions): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyed = inject(DestroyRef);
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== options.part() || event.altKey || event.ctrlKey || event.metaKey) return;
    const next = nextValue(event.key, options);
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    if (!options.inert?.()) options.write(next, event);
  };
  afterNextRender(() => {
    host.addEventListener('keydown', onKeyDown, true);
    destroyed.onDestroy(() => {
      host.removeEventListener('keydown', onKeyDown, true);
    });
  });
}
