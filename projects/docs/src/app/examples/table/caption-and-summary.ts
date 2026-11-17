import { Component } from '@angular/core';
import { WjColumn, WjTable, WjTableCaptionSlot, WjTableSummarySlot } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
}

@Component({
  selector: 'docs-table-caption-and-summary-example',
  imports: [WjTable, WjColumn, WjTableCaptionSlot, WjTableSummarySlot],
  template: `
    <wj-table [value]="orders" ariaLabelledBy="recent-orders-title">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
      <ng-template wjTableCaption>
        <div class="caption">
          <span id="recent-orders-title" class="title">Recent orders</span>
          <span class="count">{{ orders.length }} orders</span>
        </div>
      </ng-template>
      <ng-template wjTableSummary>Totals are in US dollars and include tax.</ng-template>
    </wj-table>
  `,
  styles: `
    .caption {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .title {
      font-weight: 600;
    }

    .count {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TableCaptionAndSummaryExample {
  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Mia Tran', total: 120 },
    { id: 1002, customer: 'Noah Pham', total: 45.5 },
    { id: 1003, customer: 'Ada Nguyen', total: 300 },
  ];
}
