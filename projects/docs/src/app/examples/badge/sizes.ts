import { Component } from '@angular/core';
import { WjBadge } from 'weeljack-ng/badge';

@Component({
  selector: 'docs-badge-sizes-example',
  imports: [WjBadge],
  template: `
    <div class="row">
      <wj-badge value="12" size="small" />
      <wj-badge value="12" />
      <wj-badge value="12" size="large" />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `,
})
export class BadgeSizesExample {}
