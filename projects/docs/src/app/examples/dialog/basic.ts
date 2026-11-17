import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDialog, WjDialogFooterSlot } from 'weeljack-ng/dialog';

@Component({
  selector: 'docs-dialog-basic-example',
  imports: [WjButton, WjDialog, WjDialogFooterSlot],
  template: `
    <div class="row">
      <wj-button label="Delete file" (click)="visible.set(true)" />
    </div>
    <wj-dialog
      [(visible)]="visible"
      header="Delete this file?"
      ariaDescribedBy="dialog-basic-description"
    >
      <p id="dialog-basic-description" class="message">
        This removes report.pdf for everyone who can see it. You cannot undo it.
      </p>
      <ng-template wjDialogFooter>
        <wj-button
          label="Cancel"
          severity="secondary"
          variant="outlined"
          (click)="visible.set(false)"
        />
        <wj-button label="Delete" severity="danger" (click)="visible.set(false)" />
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
export class DialogBasicExample {
  protected readonly visible = signal(false);
}
