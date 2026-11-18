import { Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { WjButton } from 'weeljack-ng/button';
import { WjDatePicker } from 'weeljack-ng/datepicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-datepicker-signal-forms-example',
  imports: [FormField, WjButton, WjDatePicker, WjField],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Start date">
        <wj-datepicker showIcon placeholder="mm/dd/yyyy" [formField]="booking.start" />
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
export class DatePickerSignalFormsExample {
  protected readonly saved = signal(false);
  private readonly value = signal<{ start: Date | null }>({ start: null });
  /** The error shows once the input is touched, or on Save, which touches every field. */
  protected readonly booking = form(this.value, (path) => {
    required(path.start, { message: 'Choose a start date.' });
  });

  protected save(event: Event): void {
    event.preventDefault();
    this.saved.set(false);
    void submit(this.booking, () => {
      this.saved.set(true);
      return Promise.resolve();
    });
  }
}
