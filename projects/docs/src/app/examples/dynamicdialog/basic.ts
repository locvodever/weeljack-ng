import { Component, inject, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDialogService } from 'weeljack-ng/dynamicdialog';
import { EditNameForm, type EditNameData } from './content';

@Component({
  selector: 'docs-dynamicdialog-basic-example',
  imports: [WjButton],
  template: `
    <wj-button label="Edit name" (click)="edit()" />
    <p role="status" class="state">Name: {{ name() }}</p>
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
export class DynamicDialogBasicExample {
  private readonly dialogs = inject(WjDialogService);
  protected readonly name = signal('Alex Kim');

  protected async edit(): Promise<void> {
    const ref = this.dialogs.open<string, EditNameData>(EditNameForm, {
      header: 'Edit name',
      data: { name: this.name() },
    });
    // `closed` settles after the dialog is gone and focus is back on the button. Cancel, Escape
    // and the close button give `undefined`, which leaves the name as it was.
    const saved = await ref.closed;
    if (saved !== undefined) {
      this.name.set(saved);
    }
  }
}
