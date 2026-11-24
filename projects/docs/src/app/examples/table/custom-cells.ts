import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { WjTag, type WjTagSeverity } from 'weeljack-ng/tag';
import { WjColumn, WjTable, WjTableCellSlot, WjTableHeaderCellSlot } from 'weeljack-ng/table';

type Status = 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';

interface Order {
  id: number;
  customer: string;
  status: Status;
  total: number;
}

@Component({
  selector: 'docs-table-custom-cells-example',
  imports: [WjTable, WjColumn, WjTableCellSlot, WjTableHeaderCellSlot, WjTag, CurrencyPipe],
  template: `
    <wj-table [value]="orders" ariaLabel="Orders with totals">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="status" header="Status">
        <ng-template wjTableCell [wjTableCellOf]="orders" let-order>
          <wj-tag [value]="order.status" [severity]="severities[order.status]" />
        </ng-template>
      </wj-column>
      <wj-column field="total" header="Total">
        <ng-template wjTableHeaderCell let-header>
          {{ header }} <span class="muted">USD</span>
        </ng-template>
        <ng-template wjTableCell [wjTableCellOf]="orders" let-order>
          <span class="money">{{ order.total | currency: 'USD' }}</span>
        </ng-template>
      </wj-column>
    </wj-table>
  `,
  styles: `
    .muted {
      color: var(--wj-text-muted-color);
      font-weight: normal;
    }

    .money {
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class TableCustomCellsExample {
  protected readonly severities: Record<Status, WjTagSeverity> = {
    Pending: 'warn',
    Shipped: 'info',
    Delivered: 'success',
    Cancelled: 'danger',
  };

  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Mia Tran', status: 'Delivered', total: 120 },
    { id: 1002, customer: 'Noah Pham', status: 'Shipped', total: 45.5 },
    { id: 1003, customer: 'Ada Nguyen', status: 'Pending', total: 300 },
    { id: 1004, customer: 'Zoe Le', status: 'Cancelled', total: 8 },
    { id: 1005, customer: 'Ivy Vo', status: 'Pending', total: 77.25 },
  ];
}
