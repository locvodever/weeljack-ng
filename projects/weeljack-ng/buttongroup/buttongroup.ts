import {
  Component,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  effect,
  inject,
  input,
} from '@angular/core';
import { ButtonGroup } from '@openng/optimus-ui/buttongroup';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';

/**
 * A row of joined `wj-button`s, over Optimus's `p-buttongroup`. Project `wj-button` elements, and
 * name the group with `ariaLabel` or `ariaLabelledBy`: the name goes on the element that carries
 * `role="group"`, in the server render too. There is no `pt`: Optimus 2.0.2 binds no part.
 *
 * This entry does not import `weeljack-ng/button`: its stylesheet restates Optimus's joined-look
 * rules for the buttons by element name.
 */
@Component({
  selector: 'wj-buttongroup',
  imports: [ButtonGroup],
  templateUrl: './buttongroup.html',
  styleUrl: './buttongroup.css',
  // The stylesheet styles the projected `wj-button` elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
})
export class WjButtonGroup {
  /** Accessible name of the group. Set on the `role="group"` element, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the group. Set on the `role="group"` element, not on the host. */
  readonly ariaLabelledBy = input<string>();

  constructor() {
    _checkWeeljackSetup('wj-buttongroup');
    _checkAriaOnHost('wj-buttongroup', 'Use the ariaLabel or ariaLabelledBy input instead');

    // No Optimus input or `pt` reaches the group's span, so name it here. Optimus's view is created
    // before this component's first update, so the span exists on the server too.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);
    effect(() => {
      const group = host.querySelector('p-buttongroup')?.firstElementChild;
      if (!group) {
        return;
      }
      const names = [
        ['aria-label', this.ariaLabel()],
        ['aria-labelledby', this.ariaLabelledBy()],
      ] as const;
      for (const [name, value] of names) {
        if (value) {
          renderer.setAttribute(group, name, value);
        } else {
          renderer.removeAttribute(group, name);
        }
      }
    });
  }
}
