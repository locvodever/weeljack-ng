import { Component } from '@angular/core';
import { WjInplace, WjInplaceContentSlot, WjInplaceDisplaySlot } from 'weeljack-ng/inplace';

@Component({
  selector: 'docs-inplace-disabled-example',
  imports: [WjInplace, WjInplaceDisplaySlot, WjInplaceContentSlot],
  template: `
    <span class="caption" id="inplace-disabled-label">Plan</span>
    <wj-inplace disabled ariaLabelledBy="inplace-disabled-label inplace-disabled-value">
      <ng-template wjInplaceDisplay>
        <span id="inplace-disabled-value">Team plan</span>
      </ng-template>
      <ng-template wjInplaceContent>Change plan</ng-template>
    </wj-inplace>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .caption {
      display: block;
      margin-block-end: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--wj-text-color);
    }
  `,
})
export class InplaceDisabledExample {}
