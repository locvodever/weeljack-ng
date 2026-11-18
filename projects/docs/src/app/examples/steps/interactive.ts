import { Component, computed, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSteps } from 'weeljack-ng/steps';

@Component({
  selector: 'docs-steps-interactive-example',
  imports: [WjSteps],
  template: `
    <section aria-labelledby="steps-interactive-caption">
      <p id="steps-interactive-caption" class="caption">Checkout</p>
      <wj-steps [model]="steps" [(activeIndex)]="step" [readonly]="false" />
      <p class="status" role="status">{{ status() }}</p>
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

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class StepsInteractiveExample {
  protected readonly steps: WjMenuItem[] = [
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Review' },
  ];

  /** The current step, from 0. A selection writes it back through `[(activeIndex)]`. */
  protected readonly step = signal(1);

  protected readonly status = computed(
    () =>
      `Step ${String(this.step() + 1)} of ${String(this.steps.length)}: ${this.steps[this.step()]?.label ?? ''}`,
  );
}
