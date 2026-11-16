import { Component } from '@angular/core';
import { WjCheckbox } from 'weeljack-ng/checkbox';

@Component({
  selector: 'docs-checkbox-disabled-example',
  imports: [WjCheckbox],
  template: `
    <div class="item">
      <wj-checkbox inputId="disabled-off" disabled />
      <label for="disabled-off">Unavailable</label>
    </div>
    <div class="item">
      <wj-checkbox inputId="disabled-on" disabled [checked]="true" />
      <label for="disabled-on">Required by your plan</label>
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
export class CheckboxDisabledExample {}
