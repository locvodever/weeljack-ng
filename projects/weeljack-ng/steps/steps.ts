import {
  Component,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { Steps } from '@openng/optimus-ui/steps';
import type { WjMenuItem } from 'weeljack-ng';
import { _checkAriaOnHost, _checkWeeljackSetup, _toOptimusMenuModel } from 'weeljack-ng/private';

/**
 * The steps of a process, with the current one marked, over Optimus's `p-steps`. Describe them as
 * `WjMenuItem` objects in `model`: each step is named by its `label`, which must be unique (Optimus
 * tracks the steps by it), and numbered from 1 in the order shown. `activeIndex` is the current
 * step, counted over the visible steps from 0, and is two-way. The steps are read-only by default,
 * so only your own buttons move between them; set `readonly` to `false` and a click, Enter or Space
 * on a step selects it and runs its `command`. **`wj-steps` needs the app's `provideRouter(...)`**:
 * Optimus injects the router when it draws the steps, and without it Angular throws `NG0201`
 * naming `ActivatedRoute`. Nothing catches it. With no visible steps, nothing renders. The steps
 * sit in a `nav` landmark: name it with `ariaLabel` or `ariaLabelledBy`.
 */
@Component({
  selector: 'wj-steps',
  imports: [Steps],
  templateUrl: './steps.html',
  styleUrl: './steps.css',
})
export class WjSteps {
  /**
   * The steps, in order. Replace the array to change them: it is read when it changes, not
   * watched. Your objects are never changed.
   */
  readonly model = input<WjMenuItem[]>([]);
  /**
   * Index of the current step, from 0, counting the visible steps only. Two-way: a selection
   * sets it. Keep it on a step that exists, or no step is current and none is a Tab stop.
   */
  readonly activeIndex = model(0);
  /**
   * Whether the steps are inert, so only your own code changes `activeIndex`. Set it to `false`
   * to let a click, Enter or Space select a step.
   */
  readonly readonly = input(true, { transform: booleanAttribute });
  /** Name of the `nav` landmark the steps sit in. Set on the `nav`, not on the host. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the `nav` landmark. Set on the `nav`, not on the host. */
  readonly ariaLabelledBy = input<string>();

  /** What Optimus gets, rebuilt only when the app passes a new array. Hidden steps are left out. */
  protected readonly shown = computed(() =>
    _toOptimusMenuModel(this.model()).items.filter((item) => item.visible !== false),
  );

  constructor() {
    _checkWeeljackSetup('wj-steps');
    _checkAriaOnHost(
      'wj-steps',
      'Use the ariaLabel or ariaLabelledBy input to name the nav landmark; each step is named by its label',
    );

    // Optimus draws no part for its `nav`, so `pt` cannot name it: write the attributes on the DOM
    // after every render, which also covers a `nav` created when steps appear.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterEveryRender(() => {
      const nav = host.querySelector('nav');
      if (nav === null) {
        return;
      }
      setAttribute(nav, 'aria-label', this.ariaLabel());
      setAttribute(nav, 'aria-labelledby', this.ariaLabelledBy());
    });
  }
}

/** Sets or removes an attribute, touching the DOM only when it differs. */
function setAttribute(element: Element, name: string, value: string | undefined): void {
  if (element.getAttribute(name) === (value ?? null)) {
    return;
  }
  if (value === undefined) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}
