import { Component } from '@angular/core';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputtext-basic-example',
  imports: [WjInputText],
  template: `
    <label for="basic-name">Full name</label>
    <input wjInputText id="basic-name" autocomplete="name" />
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
export class InputTextBasicExample {}
