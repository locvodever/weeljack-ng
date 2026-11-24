import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputGroupAddon } from 'weeljack-ng/inputgroupaddon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputgroup-button-addon-example',
  imports: [WjButton, WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <div class="item">
      <label for="inputgroup-code">Discount code</label>
      <wj-inputgroup>
        <input wjInputText id="inputgroup-code" autocomplete="off" />
        <wj-inputgroupaddon><wj-button label="Apply" /></wj-inputgroupaddon>
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
export class InputGroupButtonAddonExample {}
