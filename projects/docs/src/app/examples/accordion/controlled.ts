import { Component, signal } from '@angular/core';
import {
  WjAccordion,
  WjAccordionContent,
  WjAccordionHeader,
  WjAccordionPanel,
  type WjAccordionValue,
} from 'weeljack-ng/accordion';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-accordion-controlled-example',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader, WjAccordionContent, WjButton],
  template: `
    <div class="row">
      <wj-button
        label="Open shipping"
        size="small"
        severity="secondary"
        variant="outlined"
        (click)="value.set('shipping')"
      />
      <wj-button
        label="Open returns"
        size="small"
        severity="secondary"
        variant="outlined"
        (click)="value.set('returns')"
      />
      <wj-button
        label="Close all"
        size="small"
        severity="secondary"
        variant="outlined"
        (click)="value.set(undefined)"
      />
    </div>
    <wj-accordion [(value)]="value">
      <wj-accordion-panel value="shipping">
        <wj-accordion-header>Shipping</wj-accordion-header>
        <wj-accordion-content>
          Orders leave the warehouse within two working days.
        </wj-accordion-content>
      </wj-accordion-panel>
      <wj-accordion-panel value="returns">
        <wj-accordion-header>Returns</wj-accordion-header>
        <wj-accordion-content>
          Send an unused item back within thirty days for a full refund.
        </wj-accordion-content>
      </wj-accordion-panel>
      <wj-accordion-panel value="warranty">
        <wj-accordion-header>Warranty</wj-accordion-header>
        <wj-accordion-content>
          Every part is covered for two years from the delivery date.
        </wj-accordion-content>
      </wj-accordion-panel>
    </wj-accordion>
    <p class="state" role="status">Open panel: {{ value() ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-block-end: 16px;
    }

    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class AccordionControlledExample {
  protected readonly value = signal<WjAccordionValue | undefined>(undefined);
}
