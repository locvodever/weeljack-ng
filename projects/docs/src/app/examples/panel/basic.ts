import { Component } from '@angular/core';
import { WjPanel } from 'weeljack-ng/panel';

@Component({
  selector: 'docs-panel-basic-example',
  imports: [WjPanel],
  template: `
    <wj-panel header="Delivery notes">
      Leave the parcel with the neighbour at number 12 if nobody is home.
    </wj-panel>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }
  `,
})
export class PanelBasicExample {}
