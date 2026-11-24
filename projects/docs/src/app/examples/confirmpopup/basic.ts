import { Component, inject, signal } from '@angular/core';
import { WjConfirmationService } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjConfirmPopup } from 'weeljack-ng/confirmpopup';

@Component({
  selector: 'docs-confirmpopup-basic-example',
  imports: [WjButton, WjConfirmPopup],
  template: `
    <wj-button label="Remove" severity="secondary" variant="outlined" (click)="ask($event)" />
    <p role="status" class="state">{{ state() }}</p>
    <wj-confirmpopup />
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
export class ConfirmPopupBasicExample {
  private readonly confirmation = inject(WjConfirmationService);
  protected readonly state = signal('No choice yet');

  protected ask(event: Event): void {
    if (event.currentTarget === null) {
      return;
    }
    this.confirmation.confirm({
      message: 'Remove this item from the list?',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      // The element the popup opens beside, and the one focus returns to.
      target: event.currentTarget,
      accept: () => {
        this.state.set('Last choice: Remove');
      },
      reject: () => {
        this.state.set('Last choice: Cancel');
      },
    });
  }
}
