import { Component } from '@angular/core';
import { WjFloatLabel } from 'weeljack-ng/floatlabel';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-floatlabel-variants-example',
  imports: [WjFloatLabel, WjInputText],
  template: `
    <wj-floatlabel variant="in">
      <input wjInputText id="floatlabel-variants-in" />
      <label for="floatlabel-variants-in">In</label>
    </wj-floatlabel>
    <wj-floatlabel variant="over">
      <input wjInputText id="floatlabel-variants-over" />
      <label for="floatlabel-variants-over">Over</label>
    </wj-floatlabel>
    <wj-floatlabel variant="on">
      <input wjInputText id="floatlabel-variants-on" />
      <label for="floatlabel-variants-on">On</label>
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
export class FloatLabelVariantsExample {}
