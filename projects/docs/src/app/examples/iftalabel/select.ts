import { Component, signal } from '@angular/core';
import { WjIftaLabel } from 'weeljack-ng/iftalabel';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-iftalabel-select-example',
  imports: [WjIftaLabel, WjSelect],
  template: `
    <wj-iftalabel>
      <wj-select ariaLabelledBy="iftalabel-select-fruit" [options]="fruit" [(value)]="choice" />
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the select's span is not labelable: ariaLabelledBy names it -->
      <label id="iftalabel-select-fruit">Favourite fruit</label>
    </wj-iftalabel>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class IftaLabelSelectExample {
  protected readonly fruit: WjSelectOption<string>[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date', disabled: true },
    { label: 'Elderberry', value: 'elderberry' },
  ];
  protected readonly choice = signal<string | null>(null);
}
