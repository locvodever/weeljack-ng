import { Component, signal } from '@angular/core';
import { WjFloatLabel } from 'weeljack-ng/floatlabel';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-floatlabel-select-example',
  imports: [WjFloatLabel, WjSelect],
  template: `
    <wj-floatlabel>
      <wj-select ariaLabelledBy="floatlabel-select-fruit" [options]="fruit" [(value)]="choice" />
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the select's span is not labelable: ariaLabelledBy names it -->
      <label id="floatlabel-select-fruit">Favourite fruit</label>
    </wj-floatlabel>
  `,
  styles: `
    :host {
      display: grid;
      gap: 24px;
      padding-block-start: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class FloatLabelSelectExample {
  protected readonly fruit: WjSelectOption<string>[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date', disabled: true },
    { label: 'Elderberry', value: 'elderberry' },
  ];
  protected readonly choice = signal<string | null>(null);
}
