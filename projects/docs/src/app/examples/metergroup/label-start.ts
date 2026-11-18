import { Component } from '@angular/core';
import { WjMeterGroup, type WjMeterItem } from 'weeljack-ng/metergroup';

@Component({
  selector: 'docs-metergroup-label-start-example',
  imports: [WjMeterGroup],
  template: `
    <span id="budget-caption" class="caption">Monthly budget</span>
    <wj-metergroup [value]="items" labelPosition="start" ariaLabelledBy="budget-caption" />
  `,
  styles: `
    :host {
      --segment-1: var(--wj-sky-600);
      --segment-2: var(--wj-green-950);
      --segment-3: var(--wj-purple-500);

      display: grid;
      gap: 8px;
      max-inline-size: 40rem;
    }

    :host-context(.wj-dark) {
      --segment-1: var(--wj-sky-50);
      --segment-2: var(--wj-green-600);
      --segment-3: var(--wj-purple-50);
    }

    .caption {
      color: var(--wj-text-color);
      font-size: 0.875rem;
      font-weight: 600;
    }
  `,
})
export class MetergroupLabelStartExample {
  protected readonly items: WjMeterItem[] = [
    { label: 'Rent', value: 40, color: 'var(--segment-1)' },
    { label: 'Food', value: 20, color: 'var(--segment-2)' },
    { label: 'Travel', value: 10, color: 'var(--segment-3)' },
  ];
}
