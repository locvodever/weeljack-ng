import { Component } from '@angular/core';
import { WjTimeline, WjTimelineContentSlot, WjTimelineOppositeSlot } from 'weeljack-ng/timeline';

interface Shipment {
  status: string;
  date: string;
  note: string;
}

@Component({
  selector: 'docs-timeline-opposite-content-example',
  imports: [WjTimeline, WjTimelineContentSlot, WjTimelineOppositeSlot],
  template: `
    <wj-timeline [value]="events" ariaLabel="Shipment history with dates">
      <ng-template wjTimelineOpposite [wjTimelineOppositeOf]="events" let-event>
        <div class="date">{{ event.date }}</div>
      </ng-template>
      <ng-template wjTimelineContent [wjTimelineContentOf]="events" let-event>
        <div class="status">{{ event.status }}</div>
        <div class="note">{{ event.note }}</div>
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

    .date,
    .note {
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TimelineOppositeContentExample {
  protected readonly events: Shipment[] = [
    { status: 'Order placed', date: '12 Nov 2026', note: 'Paid by card.' },
    { status: 'Packed', date: '13 Nov 2026', note: 'Two parcels.' },
    { status: 'Shipped', date: '14 Nov 2026', note: 'With the local courier.' },
    { status: 'Delivered', date: '16 Nov 2026', note: 'Left at the front door.' },
  ];
}
