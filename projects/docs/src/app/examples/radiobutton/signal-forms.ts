import { Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjRadioButton } from 'weeljack-ng/radiobutton';

@Component({
  selector: 'docs-radiobutton-signal-forms-example',
  imports: [FormField, WjButton, WjField, WjRadioButton],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Payment method">
        <div class="options">
          <label for="signal-payment-card">
            <wj-radiobutton
              inputId="signal-payment-card"
              option="card"
              [formField]="order.payment"
            />
            Card
          </label>
          <label for="signal-payment-bank">
            <wj-radiobutton
              inputId="signal-payment-bank"
              option="bank"
              [formField]="order.payment"
            />
            Bank transfer
          </label>
          <label for="signal-payment-cash">
            <wj-radiobutton
              inputId="signal-payment-cash"
              option="cash"
              [formField]="order.payment"
            />
            Cash on delivery
          </label>
        </div>
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

    .options {
      display: grid;
      gap: 8px;
    }

    label {
      display: flex;
      align-items: start;
      gap: 8px;
      line-height: 24px;
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
export class RadioButtonSignalFormsExample {
  protected readonly saved = signal(false);
  private readonly value = signal<{ payment: string | null }>({ payment: null });
  /** The error shows once a radio is touched, or on Save, which touches every field. */
  protected readonly order = form(this.value, (path) => {
    required(path.payment, { message: 'Choose a payment method.' });
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
