import { Component } from '@angular/core';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjOverlayBadge } from 'weeljack-ng/overlaybadge';

@Component({
  selector: 'docs-overlaybadge-basic-example',
  imports: [WjOverlayBadge, WjButton],
  template: `
    <div class="row">
      <wj-overlaybadge value="4">
        <wj-button
          ariaLabel="Notifications, 4 unread"
          variant="outlined"
          severity="secondary"
          [pt]="square"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 1.5a4 4 0 0 0-4 4v2.2L2.8 10v1h10.4v-1L12 7.7V5.5a4 4 0 0 0-4-4Zm-1.5 11a1.5 1.5 0 0 0 3 0h-3Z"
            />
          </svg>
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
export class OverlayBadgeBasicExample {
  /** A projected icon does not make the button icon-only; this class gives its 44 px square. */
  protected readonly square: WjButtonPt = { root: { class: 'p-button-icon-only' } };
}
