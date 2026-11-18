import { Component } from '@angular/core';
import {
  WjAccordion,
  WjAccordionContent,
  WjAccordionHeader,
  WjAccordionPanel,
} from 'weeljack-ng/accordion';

@Component({
  selector: 'docs-accordion-multiple-example',
  imports: [WjAccordion, WjAccordionPanel, WjAccordionHeader, WjAccordionContent],
  template: `
    <wj-accordion multiple [value]="['shipping', 'returns']">
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
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }
  `,
})
export class AccordionMultipleExample {}
