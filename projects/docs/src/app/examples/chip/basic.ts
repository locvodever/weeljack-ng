import { Component } from '@angular/core';
import { WjChip } from 'weeljack-ng/chip';

@Component({
  selector: 'docs-chip-basic-example',
  imports: [WjChip],
  template: `
    <div class="row">
      <wj-chip label="Design" />
      <wj-chip label="Research" />
      <wj-chip label="Support" />
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
export class ChipBasicExample {}
