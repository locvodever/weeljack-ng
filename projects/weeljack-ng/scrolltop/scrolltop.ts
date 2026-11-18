import {
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { ButtonProps } from '@openng/optimus-ui/button';
import { ScrollTop } from '@openng/optimus-ui/scrolltop';
import {
  _ariaStrings,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
} from 'weeljack-ng/private';
import type { WjScrollTopBehavior, WjScrollTopPt } from './scrolltop-types';

/**
 * A round button, over Optimus's `p-scrolltop`, that appears once the window is scrolled past
 * `threshold` and takes the reader back to the top of the page. Place one per page, near its end:
 * every instance follows the same window, and the button is fixed 20 px from the window's bottom
 * corner.
 *
 * The button is named by `ariaLabel`, or else by the translation's `aria.scrollTop`, and appearing
 * never moves focus. Under `prefers-reduced-motion: reduce` it appears at once and a press jumps
 * to the top instead of gliding. Only the window is supported, not a scrolling parent.
 */
@Component({
  selector: 'wj-scrolltop',
  imports: [ScrollTop],
  templateUrl: './scrolltop.html',
  styleUrl: './scrolltop.css',
})
export class WjScrollTop {
  /** The window's scroll position, in px, past which the button shows. */
  readonly threshold = input(400, { transform: numberAttribute });
  /** How a press scrolls: `smooth` glides, `auto` jumps. Reduced motion always jumps. */
  readonly behavior = input<WjScrollTopBehavior>('smooth');
  /** Accessible name of the button. Defaults to the translation's `aria.scrollTop`. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the button. Set on the button. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the button. Set on the button. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the scroll-top's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjScrollTopPt>();

  private readonly reducedMotion = signal(false);
  private readonly aria = _ariaStrings();

  /** Smooth scrolling is motion that Chromium does not drop on its own, so reduced motion jumps. */
  protected readonly scrollBehavior = computed(() =>
    this.reducedMotion() ? 'auto' : this.behavior(),
  );

  /**
   * Optimus puts `buttonAriaLabel` on the `p-button` host, so the real button stays unnamed: the
   * name goes through `buttonProps` instead. `autofocus: false` stops Optimus's `AutoFocus` from
   * writing `autofocus` on the button, which would pull focus as it appears (as `wj-button` does).
   */
  protected readonly buttonProps = computed<ButtonProps>(() => ({
    rounded: true,
    autofocus: false,
    ariaLabel: this.ariaLabel() ?? this.aria('scrollTop'),
  }));

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the button. */
  protected readonly partAttributes = computed<WjScrollTopPt>(() =>
    _mergePartAttributes(this.pt(), 'pcButton.root', {
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-scrolltop');
    _checkAriaOnHost('wj-scrolltop');

    const view = inject(DOCUMENT).defaultView;
    let stop: (() => void) | undefined;
    afterNextRender(() => {
      const query = view?.matchMedia('(prefers-reduced-motion: reduce)');
      if (query) {
        const read = (): void => {
          this.reducedMotion.set(query.matches);
        };
        read();
        query.addEventListener('change', read);
        stop = () => {
          query.removeEventListener('change', read);
        };
      }
    });
    inject(DestroyRef).onDestroy(() => stop?.());
  }
}
