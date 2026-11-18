import { Component, inject, signal } from '@angular/core';
import { WjConfirmationService } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjConfirmDialog } from 'weeljack-ng/confirmdialog';

@Component({
  selector: 'docs-confirmdialog-basic-example',
  imports: [WjButton, WjConfirmDialog],
  template: `
    <wj-button label="Delete file" (click)="ask()" />
    <p role="status" class="state">{{ state() }}</p>
    <wj-confirmdialog />
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      justify-items: start;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ConfirmDialogBasicExample {
  private readonly confirmation = inject(WjConfirmationService);
  protected readonly state = signal('No choice yet');

  protected ask(): void {
    this.confirmation.confirm({
      header: 'Delete this file?',
      message: 'This removes report.pdf for everyone who can see it. You cannot undo it.',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => {
        this.state.set('Last choice: Delete');
      },
      reject: () => {
        this.state.set('Last choice: Cancel');
      },
    });
  }
}
