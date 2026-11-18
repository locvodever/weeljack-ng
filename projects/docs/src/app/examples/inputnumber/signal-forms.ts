import { Component, signal } from '@angular/core';
import { FormField, form, max, min, required, submit } from '@angular/forms/signals';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-signal-forms-example',
  imports: [FormField, WjButton, WjField, WjInputNumber],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Tickets">
        <wj-inputnumber showButtons [formField]="order.tickets" />
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
export class InputNumberSignalFormsExample {
  protected readonly saved = signal(false);
  private readonly value = signal<{ tickets: number | null }>({ tickets: null });
  /**
   * The schema's `min` and `max` also reach the input, so its arrows and spin buttons stop at 1
   * and 10. The error shows once the input is touched, or on Save, which touches every field.
   */
  protected readonly order = form(this.value, (path) => {
    required(path.tickets, { message: 'Choose 1 to 10 tickets.' });
    min(path.tickets, 1, { message: 'Choose 1 to 10 tickets.' });
    max(path.tickets, 10, { message: 'Choose 1 to 10 tickets.' });
  });

  protected save(event: Event): void {
    event.preventDefault();
    this.saved.set(false);
    void submit(this.order, () => {
      this.saved.set(true);
      return Promise.resolve();
    });
  }
}
