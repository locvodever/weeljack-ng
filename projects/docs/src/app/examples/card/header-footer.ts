import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjCard, WjCardFooterSlot, WjCardHeaderSlot } from 'weeljack-ng/card';
import { WjIcon, wjIconHouse } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-card-header-footer-example',
  imports: [WjCard, WjCardHeaderSlot, WjCardFooterSlot, WjButton, WjIcon],
  template: `
    <wj-card header="Lakeside cabin" subheader="Sleeps four">
      <ng-template wjCardHeader>
        <div class="picture"><wj-icon class="mark" [icon]="house" /></div>
      </ng-template>
      A quiet cabin with a wood stove and a jetty.
      <ng-template wjCardFooter>
        <wj-button label="Details" size="small" severity="secondary" variant="outlined" />
        <wj-button label="Book" size="small" />
      </ng-template>
    </wj-card>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .picture {
      display: grid;
      place-items: center;
      inline-size: 100%;
      block-size: 8rem;
      background: var(--wj-surface-100);
    }

    .mark {
      font-size: 3rem;
      color: var(--wj-surface-500);
    }
  `,
})
export class CardHeaderFooterExample {
  protected readonly house = wjIconHouse;
}
