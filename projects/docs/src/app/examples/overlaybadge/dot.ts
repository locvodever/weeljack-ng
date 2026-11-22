import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjIcon, wjIconBell } from 'weeljack-ng/icon';
import { WjOverlayBadge } from 'weeljack-ng/overlaybadge';

@Component({
  selector: 'docs-overlaybadge-dot-example',
  imports: [WjOverlayBadge, WjButton, WjIcon],
  template: `
    <div class="row">
      <wj-overlaybadge severity="danger">
        <wj-button ariaLabel="Notifications, new activity" variant="outlined" severity="secondary">
          <wj-icon [icon]="bell" />
        </wj-button>
      </wj-overlaybadge>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      justify-content: center;
    }
  `,
})
export class OverlayBadgeDotExample {
  protected readonly bell = wjIconBell;
}
