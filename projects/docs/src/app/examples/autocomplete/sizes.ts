import { Component, signal } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjAutoComplete } from 'weeljack-ng/autocomplete';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-autocomplete-sizes-example',
  imports: [WjAutoComplete, WjField],
  template: `
    <wj-field label="Small">
      <wj-autocomplete
        size="small"
        placeholder="Start typing a country"
        [suggestions]="suggestions()"
        (query)="search($event)"
      />
    </wj-field>
    <wj-field label="Default">
      <wj-autocomplete
        placeholder="Start typing a country"
        [suggestions]="suggestions()"
        (query)="search($event)"
      />
    </wj-field>
    <wj-field label="Large">
      <wj-autocomplete
        size="large"
        placeholder="Start typing a country"
        [suggestions]="suggestions()"
        (query)="search($event)"
      />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class AutoCompleteSizesExample {
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

  /** Answers every query with a new array: the labels that start with the text, any case. */
  protected search(text: string): void {
    this.suggestions.set(
      this.countries.filter((country) =>
        country.label.toLowerCase().startsWith(text.toLowerCase()),
      ),
    );
  }
}
