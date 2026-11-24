import { Component } from '@angular/core';
import { WjTimeline, WjTimelineContentSlot } from 'weeljack-ng/timeline';

@Component({
  selector: 'docs-timeline-horizontal-example',
  imports: [WjTimeline, WjTimelineContentSlot],
  template: `
    <wj-timeline
      [value]="steps"
      orientation="horizontal"
      align="top"
      ariaLabel="Shipment steps, horizontal"
    >
      <ng-template wjTimelineContent [wjTimelineContentOf]="steps" let-step>
        <div class="step">{{ step }}</div>
      </ng-template>
    </wj-timeline>
  `,
  styles: `
    :host {
      display: block;
    }

    .step {
      font-weight: 600;
    }
  `,
})
export class TimelineHorizontalExample {
  protected readonly steps: string[] = ['Placed', 'Packed', 'Shipped', 'Delivered'];
}
