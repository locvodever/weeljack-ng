import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { Ripple } from '@openng/optimus-ui/ripple';
import { _checkWeeljackSetup } from 'weeljack-ng/private';

/**
 * An ink effect that spreads from the pointer when a reader presses the element, over Optimus's
 * `pRipple`. It draws the ink on its own host, so it works with Optimus's global ripple switch
 * off, which `provideWeeljack` leaves off: a `wj-button` and every other wrapper stay inkless.
 *
 * The host gets `overflow: hidden` and `position: relative`, so a child that pokes out of it is
 * clipped; the host's focus outline is not. The ink follows the pointer only: pressing Enter or
 * Space draws none. Under `prefers-reduced-motion: reduce` no ink is drawn. The directive adds no
 * role, name, Tab stop or key behaviour.
 *
 * It is not a form control and has no `pt`: Optimus's ripple defines no part for one to reach.
 */
@Directive({
  selector: '[wjRipple]',
  // The `Ripple` constructor effect removes the ink while the global switch is off, so the ink is
  // created on the first press instead (`press` below), by the instance the host composes.
  hostDirectives: [Ripple],
  // The hook the harness reads: present only while `wjRippleDisabled` is on.
  host: { '[attr.data-wj-ripple-disabled]': 'wjRippleDisabled() ? "true" : null' },
})
export class WjRipple {
  /**
   * While `true`, a press draws no ink, for example while the control the ink sits on is
   * disabled. It is not called `disabled`, which would capture a `<button>`'s own binding.
   */
  readonly wjRippleDisabled = input(false, { transform: booleanAttribute });

  constructor() {
    _checkWeeljackSetup('[wjRipple]');
    const ripple = inject(Ripple);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let stop: (() => void) | undefined;

    const press = (event: MouseEvent): void => {
      if (this.wjRippleDisabled()) {
        return;
      }
      if (!ripple.getInk()) {
        ripple.create();
        // Optimus types `getInk()` as `any`: narrow it rather than cast.
        const ink: unknown = ripple.getInk();
        if (ink instanceof HTMLElement) {
          ink.setAttribute('data-wj-ink', 'true');
        }
      }
      ripple.onMouseDown(event);
    };

    // A native listener, added in the browser only: a press runs no change detection.
    afterNextRender(() => {
      host.addEventListener('mousedown', press);
      stop = () => {
        host.removeEventListener('mousedown', press);
        // Optimus's own teardown skips this while the global switch is off.
        ripple.remove();
      };
    });
    inject(DestroyRef).onDestroy(() => stop?.());
  }
}
