import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  runInInjectionContext,
} from '@angular/core';
import { MeterGroup } from '@openng/optimus-ui/metergroup';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
} from 'weeljack-ng/private';
import type { WjMeterGroupLabelPosition, WjMeterGroupPt, WjMeterItem } from './metergroup-types';

/**
 * Several percentages shown as segments of one bar, with a legend, over Optimus's `p-metergroup`.
 * It is a `meter`, not focusable, and it needs a name from you: `ariaLabel`, or `ariaLabelledBy`
 * pointing at visible text. Screen readers hear the legend as the meter's value text.
 *
 * Values are percentages that sum to 100 or less, and every item needs a colour. Pass a new array
 * to change the items: the array and its items are never modified.
 */
@Component({
  selector: 'wj-metergroup',
  imports: [MeterGroup],
  templateUrl: './metergroup.html',
  styleUrl: './metergroup.css',
})
export class WjMeterGroup {
  /** The segments, in order. Each `value` is a percentage from 0 to 100. */
  readonly value = input<WjMeterItem[]>([]);
  /** `end` puts the legend below the bar; `start` puts it above. */
  readonly labelPosition = input<WjMeterGroupLabelPosition>('end');
  /** Accessible name. Prefer `ariaLabelledBy` when a visible label exists. */
  readonly ariaLabel = input<string>();
  /** Id of the element whose text names the meter. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the meter. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the meter group's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjMeterGroupPt>();

  /**
   * The legend as one string, "Apps (16%), Messages (8%)": the legend sits inside `role="meter"`,
   * whose children are presentational, so this is how assistive technology hears it. Each percentage
   * is worked out as Optimus works out the legend's own: over its default 0 to 100 scale, rounded
   * and clamped. Nothing is written back to the items. `undefined` when there are none.
   */
  protected readonly valueText = computed(() => {
    const text = this.value()
      // Wider than `WjMeterItem`: a plain-JavaScript caller may leave `value` out, and Optimus reads that as 0.
      .map(({ label, value }: { label: string; value?: number | null }) => {
        const percent = Math.round(Math.max(0, Math.min(100, ((value ?? 0) / 100) * 100)));
        return `${label} (${String(percent)}%)`;
      })
      .join(', ');
    return text === '' ? undefined : text;
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes to the `meter` element: the name and
   * description (Optimus has no input for them) and `aria-valuetext`. Optimus does not bind
   * `aria-valuetext`, so it is not rewritten behind this wrapper's back. It changes with the items,
   * so the merged `pt` changes with them and Optimus applies, or clears, it again.
   *
   * Optimus hands its legend the group's `pt` without resolving the function form, so a function
   * hides `labelList`, `label`, `labelMarker` and `labelText` from it. The merge always returns the
   * function form; it is called here, once, when `pt` is an object with no function part, so the
   * legend parts keep working for the common case, as they do on Optimus itself.
   */
  protected readonly partAttributes = computed<WjMeterGroupPt>(() => {
    const pt = this.pt();
    const attributes = {
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
      'aria-valuetext': this.valueText(),
    };
    if (
      typeof pt === 'function' ||
      (pt != null && Object.values(pt).some((part: unknown) => typeof part === 'function'))
    ) {
      return _mergePartAttributes(pt, 'host', attributes);
    }
    return _mergePartAttributes(pt, 'host', attributes)(undefined);
  });

  constructor() {
    _checkWeeljackSetup('wj-metergroup');
    _checkAriaOnHost('wj-metergroup');
    if (ngDevMode) {
      const injector = inject(Injector);
      afterNextRender(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          runInInjectionContext(injector, () => {
            _warnOnce(
              'WJ0160',
              'wj-metergroup',
              'the meter has no accessible name',
              'Set ariaLabel, or ariaLabelledBy to the id of its visible label',
            );
          });
        }
      });
    }
  }
}
