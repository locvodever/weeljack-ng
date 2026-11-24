import { Component } from '@angular/core';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputGroupAddon } from 'weeljack-ng/inputgroupaddon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputgroup-text-addons-example',
  imports: [WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <div class="item">
      <label for="inputgroup-website">Website</label>
      <wj-inputgroup>
        <wj-inputgroupaddon id="inputgroup-website-scheme">https://</wj-inputgroupaddon>
        <input
          wjInputText
          id="inputgroup-website"
          inputmode="url"
          autocomplete="off"
          aria-describedby="inputgroup-website-scheme"
        />
      </wj-inputgroup>
    </div>
    <div class="item">
      <label for="inputgroup-amount">Price</label>
      <wj-inputgroup>
        <wj-inputgroupaddon id="inputgroup-amount-currency">$</wj-inputgroupaddon>
        <input
          wjInputText
          id="inputgroup-amount"
          inputmode="decimal"
          autocomplete="off"
          aria-describedby="inputgroup-amount-currency inputgroup-amount-cents"
        />
        <wj-inputgroupaddon id="inputgroup-amount-cents">.00</wj-inputgroupaddon>
      </wj-inputgroup>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .item {
      display: grid;
      gap: 4px;
    }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }
  `,
})
export class InputGroupTextAddonsExample {}
