import { Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-select-signal-forms-example',
  imports: [FormField, WjButton, WjField, WjSelect],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Country" hint="Where your order ships to.">
        <wj-select
          placeholder="Select a country"
          [options]="countries"
          [formField]="order.country"
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
export class SelectSignalFormsExample {
  protected readonly countries: WjSelectOption<string>[] = [
    { label: 'Canada', value: 'ca' },
    { label: 'Germany', value: 'de' },
    { label: 'Japan', value: 'jp' },
    { label: 'Vietnam', value: 'vn' },
  ];
  protected readonly saved = signal(false);
  private readonly value = signal<{ country: string | null }>({ country: null });
  /** The error shows once the select is touched, or on Save, which touches every field. */
  protected readonly order = form(this.value, (path) => {
    required(path.country, { message: 'Choose a country.' });
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
