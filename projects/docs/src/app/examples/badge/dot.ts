import { Component } from '@angular/core';
import { WjBadge } from 'weeljack-ng/badge';

@Component({
  selector: 'docs-badge-dot-example',
  imports: [WjBadge],
  template: `
    <div class="row">
      <span class="status"><wj-badge severity="success" /> Online</span>
      <span class="status"><wj-badge severity="warn" /> Away</span>
      <span class="status"><wj-badge severity="danger" /> Busy</span>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class BadgeDotExample {}
