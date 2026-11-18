import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjKeyFilter } from 'weeljack-ng/keyfilter';

@Component({
  selector: 'docs-keyfilter-regular-expression-example',
  imports: [WjField, WjInputText, WjKeyFilter],
  template: `
    <wj-field label="Product code" hint="Letters, digits and dashes.">
      <input wjInputText [wjKeyFilter]="allowed" autocomplete="off" />
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
export class KeyFilterRegularExpressionExample {
  /** Anchored over the whole text: Optimus tests the text with the new key appended. */
  protected readonly allowed = /^[A-Za-z0-9-]*$/;
}
