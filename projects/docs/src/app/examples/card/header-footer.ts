import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjCard, WjCardFooterSlot, WjCardHeaderSlot } from 'weeljack-ng/card';

@Component({
  selector: 'docs-card-header-footer-example',
  imports: [WjCard, WjCardHeaderSlot, WjCardFooterSlot, WjButton],
  template: `
    <wj-card header="Lakeside cabin" subheader="Sleeps four">
      <ng-template wjCardHeader>
        <svg
          class="picture"
          viewBox="0 0 320 128"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Illustration of a lakeside cabin"
        >
          <rect class="sky" width="320" height="128" />
          <rect class="lake" y="88" width="320" height="40" />
          <polygon class="cabin" points="104,88 104,56 136,32 168,56 168,88" />
          <rect class="jetty" x="176" y="84" width="96" height="6" />
        </svg>
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
      display: block;
      inline-size: 100%;
      block-size: 8rem;
    }

    .sky {
      fill: var(--wj-surface-100);
    }

    .lake {
      fill: var(--wj-surface-300);
    }

    .cabin {
      fill: var(--wj-surface-500);
    }

    .jetty {
      fill: var(--wj-surface-700);
    }
  `,
})
export class CardHeaderFooterExample {}
