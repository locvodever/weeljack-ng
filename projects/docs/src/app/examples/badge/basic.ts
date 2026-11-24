import { Component } from '@angular/core';
import { WjBadge } from 'weeljack-ng/badge';

@Component({
  selector: 'docs-badge-basic-example',
  imports: [WjBadge],
  template: `
    <div class="row">
      <span>Messages</span>
      <wj-badge value="8" />
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
export class BadgeBasicExample {}
