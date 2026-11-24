import { Component } from '@angular/core';
import { WjDivider } from 'weeljack-ng/divider';

@Component({
  selector: 'docs-divider-basic-example',
  imports: [WjDivider],
  template: `
    <p>Orders ship within two working days.</p>
    <wj-divider />
    <p>Returns are free for thirty days.</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    p {
      margin: 0;
    }
  `,
})
export class DividerBasicExample {}
