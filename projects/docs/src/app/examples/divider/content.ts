import { Component } from '@angular/core';
import { WjDivider } from 'weeljack-ng/divider';

@Component({
  selector: 'docs-divider-content-example',
  imports: [WjDivider],
  template: `
    <wj-divider align="left">Left</wj-divider>
    <wj-divider align="center">Center</wj-divider>
    <wj-divider align="right">Right</wj-divider>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }
  `,
})
export class DividerContentExample {}
