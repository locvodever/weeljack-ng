import { Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import type { WjOption } from 'weeljack-ng';
import { WjAutoComplete } from 'weeljack-ng/autocomplete';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-autocomplete-signal-forms-example',
  imports: [FormField, WjAutoComplete, WjButton, WjField],
  template: `
    <form novalidate (submit)="save($event)">
      <wj-field label="Country" hint="Start typing, then pick from the list.">
        <wj-autocomplete
          placeholder="Start typing a country"
          [suggestions]="suggestions()"
          [formField]="trip.country"
          (query)="search($event)"
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
export class AutoCompleteSignalFormsExample {
  private readonly countries: WjOption<string>[] = [
    { label: 'Argentina', value: 'ar' },
    { label: 'Australia', value: 'au' },
    { label: 'Brazil', value: 'br' },
    { label: 'Canada', value: 'ca' },
    { label: 'Egypt', value: 'eg' },
    { label: 'France', value: 'fr' },
    { label: 'Germany', value: 'de' },
    { label: 'India', value: 'in' },
    { label: 'Japan', value: 'jp' },
    { label: 'Kenya', value: 'ke' },
    { label: 'Mexico', value: 'mx' },
    { label: 'New Zealand', value: 'nz' },
    { label: 'Norway', value: 'no' },
    { label: 'Singapore', value: 'sg' },
    { label: 'Spain', value: 'es' },
    { label: 'Vietnam', value: 'vn' },
  ];
  protected readonly suggestions = signal<WjOption<string>[]>([]);
  protected readonly saved = signal(false);
  private readonly value = signal<{ country: WjOption<string> | null }>({ country: null });
  /** The field holds the picked option, `null` until one is picked. The error shows once the input is touched, or on Save. */
  protected readonly trip = form(this.value, (path) => {
    required(path.country, { message: 'Pick a country from the list.' });
  });

  /** Answers every query with a new array: the labels that start with the text, any case. */
  protected search(text: string): void {
    this.suggestions.set(
      this.countries.filter((country) =>
        country.label.toLowerCase().startsWith(text.toLowerCase()),
      ),
    );
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.saved.set(false);
    void submit(this.trip, () => {
      this.saved.set(true);
      return Promise.resolve();
    });
  }
}
