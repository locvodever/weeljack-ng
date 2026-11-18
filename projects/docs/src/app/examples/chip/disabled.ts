import { Component } from '@angular/core';
import { WjChip } from 'weeljack-ng/chip';

@Component({
  selector: 'docs-chip-disabled-example',
  imports: [WjChip],
  template: `
    <div class="row">
      <wj-chip label="Required" removable disabled />
      <wj-chip label="Optional" removable />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class ChipDisabledExample {}
