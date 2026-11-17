import { Component } from '@angular/core';
import { WjTimeline, WjTimelineContentSlot } from 'weeljack-ng/timeline';

interface Shipment {
  status: string;
  date: string;
}

@Component({
  selector: 'docs-timeline-basic-example',
  imports: [WjTimeline, WjTimelineContentSlot],
  template: `
    <wj-timeline [value]="events" ariaLabel="Shipment history">
      <ng-template wjTimelineContent [wjTimelineContentOf]="events" let-event>
        <div class="status">{{ event.status }}</div>
        <div class="date">{{ event.date }}</div>
      </ng-template>
    </wj-timeline>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 32rem;
    }

    .status {
      font-weight: 600;
    }

    .date {
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TimelineBasicExample {
  protected readonly events: Shipment[] = [
    { status: 'Order placed', date: '12 Nov 2026' },
    { status: 'Packed', date: '13 Nov 2026' },
    { status: 'Shipped', date: '14 Nov 2026' },
    { status: 'Delivered', date: '16 Nov 2026' },
  ];
}
