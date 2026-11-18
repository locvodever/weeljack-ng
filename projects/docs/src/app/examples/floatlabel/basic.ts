import { Component } from '@angular/core';
import { WjFloatLabel } from 'weeljack-ng/floatlabel';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-floatlabel-basic-example',
  imports: [WjFloatLabel, WjInputText],
  template: `
    <wj-floatlabel>
      <input wjInputText id="floatlabel-basic-email" type="email" autocomplete="email" />
      <label for="floatlabel-basic-email">Email</label>
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
export class FloatLabelBasicExample {}
