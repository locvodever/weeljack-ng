import { Component, DestroyRef, inject, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDialog, WjDialogFooterSlot } from 'weeljack-ng/dialog';

@Component({
  selector: 'docs-dialog-busy-example',
  imports: [WjButton, WjDialog, WjDialogFooterSlot],
  template: `
    <div class="row">
      <wj-button label="Delete file" (click)="visible.set(true)" />
    </div>
    <wj-dialog
      [(visible)]="visible"
      [closable]="!deleting()"
      header="Delete this file?"
      ariaDescribedBy="dialog-busy-description"
    >
      <p id="dialog-busy-description" class="message">
        This removes report.pdf for everyone who can see it. You cannot undo it.
      </p>
      <ng-template wjDialogFooter>
        <wj-button
          label="Cancel"
          severity="secondary"
          variant="outlined"
          [disabled]="deleting()"
          (click)="visible.set(false)"
        />
        <wj-button label="Delete" severity="danger" [loading]="deleting()" (click)="remove()" />
      </ng-template>
    </wj-dialog>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .message {
      max-inline-size: 28rem;
      margin: 0;
    }
  `,
})
export class DialogBusyExample {
  protected readonly visible = signal(false);
  protected readonly deleting = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  /** Stands in for a request: busy for a moment, then done and closed. */
  protected remove(): void {
    this.deleting.set(true);
    this.timer = setTimeout(() => {
      this.deleting.set(false);
      this.visible.set(false);
    }, 2000);
  }
}
