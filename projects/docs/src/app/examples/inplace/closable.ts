import { Component } from '@angular/core';
import { WjInplace, WjInplaceContentSlot, WjInplaceDisplaySlot } from 'weeljack-ng/inplace';

@Component({
  selector: 'docs-inplace-closable-example',
  imports: [WjInplace, WjInplaceDisplaySlot, WjInplaceContentSlot],
  template: `
    <wj-inplace closable>
      <ng-template wjInplaceDisplay>Show the delivery address</ng-template>
      <ng-template wjInplaceContent>
        <address>Mara Ellis<br />14 Harbour Street<br />Lakeside 4521</address>
      </ng-template>
    </wj-inplace>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    address {
      margin: 0;
      padding-block: 9px;
      font-style: normal;
    }
  `,
})
export class InplaceClosableExample {}
