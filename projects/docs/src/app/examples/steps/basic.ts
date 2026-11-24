import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSteps } from 'weeljack-ng/steps';

@Component({
  selector: 'docs-steps-basic-example',
  imports: [WjSteps],
  template: `
    <p id="steps-basic-caption" class="caption">Checkout</p>
    <wj-steps [model]="steps" [activeIndex]="1" ariaLabelledBy="steps-basic-caption" />
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .caption {
      margin: 0 0 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--wj-text-color);
    }
  `,
})
export class StepsBasicExample {
  /** Labels are unique: Optimus tracks the steps by label. */
  protected readonly steps: WjMenuItem[] = [
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Review' },
  ];
}
