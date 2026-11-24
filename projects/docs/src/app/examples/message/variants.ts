import { Component } from '@angular/core';
import { WjMessage } from 'weeljack-ng/message';

@Component({
  selector: 'docs-message-variants-example',
  imports: [WjMessage],
  template: `
    <wj-message><strong>Default.</strong> A tinted box with an edge.</wj-message>
    <wj-message variant="outlined"><strong>Outlined.</strong> An edge and no fill.</wj-message>
    <wj-message variant="simple"><strong>Simple.</strong> Coloured text with no box.</wj-message>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      max-inline-size: 40rem;
    }
  `,
})
export class MessageVariantsExample {}
