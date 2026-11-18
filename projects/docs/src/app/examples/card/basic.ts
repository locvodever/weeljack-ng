import { Component } from '@angular/core';
import { WjCard } from 'weeljack-ng/card';

@Component({
  selector: 'docs-card-basic-example',
  imports: [WjCard],
  template: `
    <wj-card header="Weekly summary" subheader="Week 46">
      Twelve tasks closed and three opened. The release checklist is on track.
    </wj-card>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }
  `,
})
export class CardBasicExample {}
