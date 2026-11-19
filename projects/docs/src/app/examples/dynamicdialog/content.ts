import { Component, inject, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjDynamicDialogRef } from 'weeljack-ng/dynamicdialog';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

/** What the dialog is opened with: `open(EditNameForm, { header, data })`. */
export interface EditNameData {
  name: string;
}

/**
 * The component the dialog shows. It is not a dialog: it lays out its own field and actions, and
 * closes itself through the ref it injects. Close with a result to hand a value back through
 * `closed`; close with nothing for "no change".
 */
@Component({
  selector: 'docs-edit-name-form',
  imports: [WjButton, WjField, WjInputText],
  template: `
    <form (submit)="save($event)" novalidate>
      <wj-field label="Name" [error]="error()">
        <input
          wjInputText
          #field
          required
          autocomplete="name"
          [value]="name()"
          (input)="name.set(field.value)"
        />
      </wj-field>
      <div class="actions">
        <wj-button label="Cancel" severity="secondary" variant="outlined" (click)="ref.close()" />
        <wj-button label="Save" type="submit" />
      </div>
    </form>
  `,
  styles: `
    form {
      inline-size: 24rem;
      max-inline-size: 100%;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-block-start: 16px;
    }
  `,
})
export class EditNameForm {
  protected readonly ref = inject<WjDynamicDialogRef<string, EditNameData>>(WjDynamicDialogRef);
  protected readonly name = signal(this.ref.data.name);
  protected readonly error = signal('');

  protected save(event: Event): void {
    event.preventDefault();
    const name = this.name().trim();
    if (name === '') {
      this.error.set('Enter a name.');
      return;
    }
    this.ref.close(name);
  }
}
