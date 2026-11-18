import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  runInInjectionContext,
} from '@angular/core';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
} from 'weeljack-ng/private';
import type { WjProgressSpinnerPt } from './progressspinner-types';

/**
 * An indeterminate spinner for work in progress, over Optimus's `p-progressspinner`. It is a
 * `progressbar` with `aria-busy`, not focusable, and it needs a name from you: `ariaLabel`, or
 * `ariaLabelledBy` pointing at visible text.
 *
 * The host is a 100 × 100 px box that you size with `style` or `class`. Its appearance is not
 * announced, so announce the outcome when the work ends, and remove the spinner then. Rotation
 * stops when the reader asks for reduced motion, leaving a still arc: pair it with visible text.
 */
@Component({
  selector: 'wj-progressspinner',
  imports: [ProgressSpinner],
  templateUrl: './progressspinner.html',
  styleUrl: './progressspinner.css',
})
export class WjProgressSpinner {
  /** Accessible name. Prefer `ariaLabelledBy` when a visible label exists. */
  readonly ariaLabel = input<string>();
  /** Id of the element whose text names the spinner. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the spinner. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the spinner's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjProgressSpinnerPt>();

  /** `pt` forwarded as given, plus the label and description ids routed to the `progressbar`. */
  protected readonly partAttributes = computed<WjProgressSpinnerPt>(() =>
    _mergePartAttributes(this.pt(), 'host', {
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-progressspinner');
    _checkAriaOnHost('wj-progressspinner');
    if (ngDevMode) {
      const injector = inject(Injector);
      afterNextRender(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          runInInjectionContext(injector, () => {
            _warnOnce(
              'WJ0160',
              'wj-progressspinner',
              'the indicator has no accessible name',
              'Set ariaLabel, or ariaLabelledBy to the id of its visible label',
            );
          });
        }
      });
    }
  }
}
