import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputGroupAddon } from 'weeljack-ng/inputgroupaddon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputgroup-in-a-field-example',
  imports: [WjField, WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <wj-field label="Weight" hint="Round to the nearest kilogram.">
      <wj-inputgroup>
        <input
          wjInputText
          inputmode="numeric"
          autocomplete="off"
          aria-describedby="inputgroup-weight-unit"
        />
        <wj-inputgroupaddon id="inputgroup-weight-unit">kg</wj-inputgroupaddon>
      </wj-inputgroup>
    </wj-field>
    <wj-field label="Price" error="Enter a price above zero.">
      <wj-inputgroup>
        <wj-inputgroupaddon id="inputgroup-price-unit">$</wj-inputgroupaddon>
        <input
          wjInputText
          inputmode="decimal"
          autocomplete="off"
          aria-describedby="inputgroup-price-unit"
        />
      </wj-inputgroup>
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class InputGroupInAFieldExample {}
