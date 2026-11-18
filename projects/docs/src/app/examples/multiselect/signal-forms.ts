import { Component, signal } from '@angular/core';
import { FormField, form, minLength, submit } from '@angular/forms/signals';
import type { WjOption } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjMultiSelect } from 'weeljack-ng/multiselect';

@Component({
  selector: 'docs-multiselect-signal-forms-example',
  imports: [FormField, WjButton, WjField, WjMultiSelect],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Working days" hint="Pick every day you can work.">
        <wj-multiselect placeholder="Select days" [options]="days" [formField]="rota.days" />
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
export class MultiSelectSignalFormsExample {
  protected readonly days: WjOption<string>[] = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
  ];
  protected readonly saved = signal(false);
  private readonly value = signal<{ days: string[] }>({ days: [] });
  /** The field holds a `string[]`, empty until a day is picked. The error shows once the control is touched, or on Save. */
  protected readonly rota = form(this.value, (path) => {
    minLength(path.days, 1, { message: 'Pick at least one day.' });
  });

  protected save(event: Event): void {
    event.preventDefault();
    this.saved.set(false);
    void submit(this.rota, () => {
      this.saved.set(true);
      return Promise.resolve();
    });
  }
}
