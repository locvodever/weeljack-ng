import { Component } from '@angular/core';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';

@Component({
  selector: 'docs-toggleswitch-disabled-example',
  imports: [WjToggleSwitch],
  template: `
    <div class="item">
      <wj-toggleswitch inputId="disabled-off" disabled />
      <label for="disabled-off">Unavailable</label>
    </div>
    <div class="item">
      <wj-toggleswitch inputId="disabled-on" disabled [checked]="true" />
      <label for="disabled-on">Managed by your admin</label>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    label {
      line-height: 24px;
    }
  `,
})
export class ToggleSwitchDisabledExample {}
