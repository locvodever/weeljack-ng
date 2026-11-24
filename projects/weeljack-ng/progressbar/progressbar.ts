import {
  Component,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  runInInjectionContext,
} from '@angular/core';
import { ProgressBar } from '@openng/optimus-ui/progressbar';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
} from 'weeljack-ng/private';
import type { WjProgressBarMode, WjProgressBarPt } from './progressbar-types';

/**
 * A bar that shows how far a task has got, or that work is ongoing, over Optimus's
 * `p-progressbar`. It is a `progressbar`, not focusable, and it needs a name from you:
 * `ariaLabel`, or `ariaLabelledBy` pointing at visible text.
 *
 * Pass whole numbers from 0 to 100. The indeterminate sweep keeps running under reduced motion:
 * it is the only sign that work is going on. When the work fails, replace the bar with a message.
 */
@Component({
  selector: 'wj-progressbar',
  imports: [ProgressBar],
  templateUrl: './progressbar.html',
  styleUrl: './progressbar.css',
})
export class WjProgressBar {
  /** Progress as a percentage from 0 to 100. Ignored in `indeterminate` mode. */
  readonly value = input(0, { transform: (raw: unknown) => numberAttribute(raw, 0) });
  /** `determinate` fills the bar to `value`; `indeterminate` sweeps it for work of unknown length. */
  readonly mode = input<WjProgressBarMode>('determinate');
  /** Shows the value as "40%" inside the fill. */
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Accessible name. Prefer `ariaLabelledBy` when a visible label exists. */
  readonly ariaLabel = input<string>();
  /** Id of the element whose text names the bar. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the bar. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the bar's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjProgressBarPt>();

  /** No value at all when indeterminate, so Optimus writes no `aria-valuenow`. */
  protected readonly optimusValue = computed(() =>
    this.mode() === 'determinate' ? this.value() : undefined,
  );

  /**
   * `pt` forwarded as given, plus what this wrapper routes to the `progressbar` element: the name
   * and description (Optimus has no `ariaLabel` input here), and two removals.
   * - `aria-level`: Optimus binds it to the value and a unit, which ARIA does not allow on a
   *   `progressbar`, and rewrites it on every value change, so a removal applied only once would
   *   not survive the next change. The routed `aria-valuetext` ("40%") changes with the value, so
   *   the merged `pt` changes with it and Optimus applies it again, the removal with it.
   * - `aria-valuenow` when indeterminate: Optimus reads "no value" as `NaN` and writes `"NaN"`.
   */
  protected readonly partAttributes = computed<WjProgressBarPt>(() => {
    const determinate = this.mode() === 'determinate';
    return _mergePartAttributes(this.pt(), 'host', {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
      'aria-valuetext': determinate ? `${String(this.value())}%` : undefined,
      'aria-level': undefined,
      // A cleared key is a removal, so it is only present when there is no value to keep.
      ...(determinate ? {} : { 'aria-valuenow': undefined }),
    });
  });

  constructor() {
    _checkWeeljackSetup('wj-progressbar');
    _checkAriaOnHost('wj-progressbar');
    if (ngDevMode) {
      const injector = inject(Injector);
      afterNextRender(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          runInInjectionContext(injector, () => {
            _warnOnce(
              'WJ0160',
              'wj-progressbar',
              'the indicator has no accessible name',
              'Set ariaLabel, or ariaLabelledBy to the id of its visible label',
            );
          });
        }
      });
    }
  }
}
