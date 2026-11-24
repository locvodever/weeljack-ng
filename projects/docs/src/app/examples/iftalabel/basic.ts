import { Component } from '@angular/core';
import { WjIftaLabel } from 'weeljack-ng/iftalabel';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iftalabel-basic-example',
  imports: [WjIftaLabel, WjInputText],
  template: `
    <wj-iftalabel>
      <input wjInputText id="iftalabel-basic-email" type="email" autocomplete="email" />
      <label for="iftalabel-basic-email">Email</label>
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
export class IftaLabelBasicExample {}
