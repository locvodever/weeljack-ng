import { Component, signal } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjAutoComplete } from 'weeljack-ng/autocomplete';

@Component({
  selector: 'docs-autocomplete-basic-example',
  imports: [WjAutoComplete],
  template: `
    <label for="basic-country">Country</label>
    <wj-autocomplete
      inputId="basic-country"
      placeholder="Start typing a country"
      [suggestions]="suggestions()"
      [(value)]="country"
      (query)="search($event)"
    />
    @let picked = country();
    <p class="state">Value: {{ picked ? picked.label + ' (' + picked.value + ')' : 'none' }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .state {
      flex-basis: 100%;
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class AutoCompleteBasicExample {
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
  protected readonly country = signal<WjOption<string> | null>(null);

  /** Answers every query with a new array: the labels that start with the text, any case. */
  protected search(text: string): void {
    this.suggestions.set(
      this.countries.filter((country) =>
        country.label.toLowerCase().startsWith(text.toLowerCase()),
      ),
    );
  }
}
