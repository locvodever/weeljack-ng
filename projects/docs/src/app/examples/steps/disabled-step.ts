import { Component, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSteps } from 'weeljack-ng/steps';

@Component({
  selector: 'docs-steps-disabled-step-example',
  imports: [WjSteps],
  template: `
    <section aria-labelledby="steps-disabled-caption">
      <p id="steps-disabled-caption" class="caption">Checkout</p>
      <wj-steps [model]="steps" [(activeIndex)]="step" [readonly]="false" />
    </section>
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
export class StepsDisabledStepExample {
  /** A disabled step is faded and runs nothing, and the arrow keys still reach it. */
  protected readonly steps: WjMenuItem[] = [
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Review', disabled: true },
  ];

  protected readonly step = signal(1);
}
