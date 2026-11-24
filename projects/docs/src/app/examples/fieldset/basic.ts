import { Component } from '@angular/core';
import { WjFieldset } from 'weeljack-ng/fieldset';

@Component({
  selector: 'docs-fieldset-basic-example',
  imports: [WjFieldset],
  template: `
    <wj-fieldset legend="Shipping address">
      <p class="address">Ada Example<br />12 Sample Street<br />Springfield 00000</p>
    </wj-fieldset>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .address {
      margin: 0;
    }
  `,
})
export class FieldsetBasicExample {}
