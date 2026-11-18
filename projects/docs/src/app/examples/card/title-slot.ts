import { Component } from '@angular/core';
import { WjCard, WjCardSubtitleSlot, WjCardTitleSlot } from 'weeljack-ng/card';

@Component({
  selector: 'docs-card-title-slot-example',
  imports: [WjCard, WjCardTitleSlot, WjCardSubtitleSlot],
  template: `
    <wj-card>
      <ng-template wjCardTitle><h4>Release notes</h4></ng-template>
      <ng-template wjCardSubtitle>Version <strong>2.4</strong></ng-template>
      Fixes three bugs in the export and speeds up the first load.
    </wj-card>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }
  `,
})
export class CardTitleSlotExample {}
