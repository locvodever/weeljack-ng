import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjAutoComplete } from 'weeljack-ng/autocomplete';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-autocomplete-disabled-example',
  imports: [WjAutoComplete, WjField],
  template: `
    <wj-field label="Country" hint="Managed by your administrator.">
      <wj-autocomplete disabled [value]="japan" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class AutoCompleteDisabledExample {
  /** The value is the whole option, so its label shows with no search run. */
  protected readonly japan: WjOption<string> = { label: 'Japan', value: 'jp' };
}
