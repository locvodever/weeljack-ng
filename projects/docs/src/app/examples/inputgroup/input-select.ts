import { Component } from '@angular/core';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-inputgroup-input-select-example',
  imports: [WjInputGroup, WjInputText, WjSelect],
  template: `
    <div class="item">
      <span id="inputgroup-price-caption" class="caption">Price</span>
      <wj-inputgroup role="group" aria-labelledby="inputgroup-price-caption">
        <input
          wjInputText
          aria-label="Amount"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0.00"
        />
        <wj-select ariaLabel="Currency" [options]="currencies" value="USD" />
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

    .caption {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }
  `,
})
export class InputGroupInputSelectExample {
  protected readonly currencies: WjSelectOption<string>[] = [
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'VND', value: 'VND' },
  ];
}
