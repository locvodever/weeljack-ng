import { Component } from '@angular/core';
import { WjMessage } from 'weeljack-ng/message';

@Component({
  selector: 'docs-message-sizes-example',
  imports: [WjMessage],
  template: `
    <wj-message size="small"><strong>Small.</strong> For dense layouts.</wj-message>
    <wj-message><strong>Default.</strong> For most layouts.</wj-message>
    <wj-message size="large"><strong>Large.</strong> For a page-level message.</wj-message>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      max-inline-size: 40rem;
    }
  `,
})
export class MessageSizesExample {}
