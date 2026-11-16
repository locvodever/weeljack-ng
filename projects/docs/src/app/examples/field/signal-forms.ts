import { Component, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-field-signal-forms-example',
  imports: [FormField, WjButton, WjField, WjInputText],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Email" hint="We only use it to send your receipt.">
        <input
          wjInputText
          type="email"
          autocomplete="email"
          placeholder="name@example.com"
          [formField]="receipt.email"
        />
      </wj-field>
      <div class="actions">
        <wj-button type="submit" label="Save" />
        @if (saved()) {
          <p role="status">Saved.</p>
        }
      </div>
    </form>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }

    form {
      display: grid;
      gap: 16px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    p {
      margin: 0;
    }
  `,
})
export class FieldSignalFormsExample {
  protected readonly saved = signal(false);
  private readonly value = signal({ email: '' });
  /** The error shows once the input is touched, or on Save, which touches every field. */
  protected readonly receipt = form(this.value, (path) => {
    required(path.email, { message: 'Enter an email address.' });
    email(path.email, { message: 'Enter an email address.' });
  });

  protected save(event: Event): void {
    event.preventDefault();
    this.saved.set(false);
    void submit(this.receipt, () => {
      this.saved.set(true);
      return Promise.resolve();
    });
  }
}
