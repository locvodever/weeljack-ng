import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDrawer, WjDrawerFooterSlot } from 'weeljack-ng/drawer';

@Component({
  selector: 'docs-drawer-with-footer-example',
  imports: [WjButton, WjDrawer, WjDrawerFooterSlot],
  template: `
    <div class="row">
      <wj-button label="Open filters" (click)="visible.set(true)" />
    </div>
    <wj-drawer
      [(visible)]="visible"
      position="right"
      header="Filters"
      ariaDescribedBy="drawer-footer-description"
    >
      <p id="drawer-footer-description" class="message">
        Narrow the list down. The actions sit in the footer, below the body.
      </p>
      <ng-template wjDrawerFooter>
        <wj-button
          label="Cancel"
          severity="secondary"
          variant="outlined"
          (click)="visible.set(false)"
        />
        <wj-button label="Apply" (click)="visible.set(false)" />
      </ng-template>
    </wj-drawer>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .message {
      margin: 0;
    }
  `,
})
export class DrawerWithFooterExample {
  protected readonly visible = signal(false);
}
