import { Component, DestroyRef, inject, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDrawer, WjDrawerFooterSlot } from 'weeljack-ng/drawer';

@Component({
  selector: 'docs-drawer-busy-example',
  imports: [WjButton, WjDrawer, WjDrawerFooterSlot],
  template: `
    <div class="row">
      <wj-button label="Open settings" (click)="visible.set(true)" />
    </div>
    <wj-drawer
      [(visible)]="visible"
      [closable]="!saving()"
      position="right"
      header="Settings"
      ariaDescribedBy="drawer-busy-description"
    >
      <p id="drawer-busy-description" class="message">
        While saving, there is no close button, and Escape and the backdrop do nothing.
      </p>
      <ng-template wjDrawerFooter>
        <wj-button
          label="Cancel"
          severity="secondary"
          variant="outlined"
          [disabled]="saving()"
          (click)="visible.set(false)"
        />
        <wj-button label="Save" [loading]="saving()" (click)="save()" />
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
export class DrawerBusyExample {
  protected readonly visible = signal(false);
  protected readonly saving = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  /** Stands in for a request: busy for a moment, then done and closed. */
  protected save(): void {
    this.saving.set(true);
    this.timer = setTimeout(() => {
      this.saving.set(false);
      this.visible.set(false);
    }, 2000);
  }
}
