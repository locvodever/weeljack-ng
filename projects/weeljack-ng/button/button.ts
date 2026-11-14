import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { Button } from '@openng/optimus-ui/button';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type {
  WjButtonPt,
  WjButtonSeverity,
  WjButtonSize,
  WjButtonType,
  WjButtonVariant,
} from './button-types';

/**
 * A button over Optimus's `p-button`: 44 px tall by default, with the label, loading and disabled
 * states of the default look. Put the click handler on `wj-button` itself. While `disabled` or
 * `loading`, the button emits no `click` to it.
 *
 * Content you project (an icon, say) renders beside the `label`. Icon-only buttons set `ariaLabel`.
 */
@Component({
  selector: 'wj-button',
  imports: [Button],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class WjButton {
  /** Text of the button. Rendered as text, never as HTML. */
  readonly label = input<string>();
  /** Shows a spinner beside the label and makes the button inert. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Makes the button inert. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Height step. */
  readonly size = input<WjButtonSize>();
  /** `outlined` or `text` fill instead of the solid one. */
  readonly variant = input<WjButtonVariant>();
  /** Colour role. */
  readonly severity = input<WjButtonSeverity>();
  /** Native `type` of the button element. */
  readonly type = input<WjButtonType>('button');
  /** Accessible name when the button has no visible text. Set on the focusable element. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the button. Set on the focusable element. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the button. Set on the focusable element. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the button's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjButtonPt>();

  /** `pt` forwarded as given, plus the ARIA attributes this wrapper routes to the button. */
  protected readonly partAttributes = computed<WjButtonPt>(() => {
    const pt = this.pt();
    const own: Record<string, string> = {};
    const labelledBy = this.ariaLabelledBy();
    const describedBy = this.ariaDescribedBy();
    if (labelledBy !== undefined) {
      own['aria-labelledby'] = labelledBy;
    }
    if (describedBy !== undefined) {
      own['aria-describedby'] = describedBy;
    }
    if (this.loading()) {
      own['aria-busy'] = 'true';
    }
    return (context) => {
      const parts = typeof pt === 'function' ? pt(context) : pt;
      const root = typeof parts?.root === 'function' ? parts.root(context) : parts?.root;
      return { ...parts, root: { ...(typeof root === 'string' ? { class: root } : root), ...own } };
    };
  });

  constructor() {
    _checkWeeljackSetup('wj-button');
    _checkAriaOnHost('wj-button');

    // The consumer's `(click)` sits on this host, so an inert button must not let a click through,
    // whatever the browser does with clicks on a disabled control's children. A capture listener
    // on the host runs before the consumer's listener on the same element.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const blockInactiveClick = (event: Event): void => {
      if (this.disabled() || this.loading()) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };
    host.addEventListener('click', blockInactiveClick, { capture: true });
    inject(DestroyRef).onDestroy(() => {
      host.removeEventListener('click', blockInactiveClick, { capture: true });
    });
  }
}
