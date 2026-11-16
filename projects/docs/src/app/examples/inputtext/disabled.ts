import { Component } from '@angular/core';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputtext-disabled-example',
  imports: [WjInputText],
  template: `
    <label for="disabled-name">Full name</label>
    <input wjInputText id="disabled-name" disabled value="Ada Lovelace" />
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class InputTextDisabledExample {}
