import { Component, signal } from '@angular/core';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-select-basic-example',
  imports: [WjSelect],
  template: `
    <span id="basic-fruit">Favourite fruit</span>
    <wj-select
      ariaLabelledBy="basic-fruit"
      placeholder="Pick a fruit"
      [options]="fruit"
      [(value)]="choice"
    />
    <p>Picked: {{ choice() ?? 'nothing yet' }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    p {
      flex-basis: 100%;
      margin: 0;
    }
  `,
})
export class SelectBasicExample {
  protected readonly fruit: WjSelectOption<string>[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date', disabled: true },
    { label: 'Elderberry', value: 'elderberry' },
  ];
  protected readonly choice = signal<string | null>(null);
}
