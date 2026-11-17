import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { WjColumn, WjTable, WjTableCellSlot } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
  date: Date;
}

@Component({
  selector: 'docs-table-sorting-example',
  imports: [WjTable, WjColumn, WjTableCellSlot, CurrencyPipe, DatePipe],
  template: `
    <wj-table [value]="orders" sortField="date" [sortOrder]="-1" ariaLabel="Orders, sortable">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" sortable />
      <wj-column field="total" header="Total" sortable>
        <ng-template wjTableCell [wjTableCellOf]="orders" let-order>
          <span class="money">{{ order.total | currency: 'USD' }}</span>
        </ng-template>
      </wj-column>
      <wj-column field="date" header="Date" sortable>
        <ng-template wjTableCell [wjTableCellOf]="orders" let-order>
          {{ order.date | date: 'mediumDate' }}
        </ng-template>
      </wj-column>
    </wj-table>
  `,
  styles: `
    .money {
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class TableSortingExample {
  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Mia Tran', total: 120, date: new Date(2026, 9, 28) },
    { id: 1002, customer: 'Noah Pham', total: 45.5, date: new Date(2026, 10, 2) },
    { id: 1003, customer: 'Ada Nguyen', total: 300, date: new Date(2026, 10, 5) },
    { id: 1004, customer: 'Zoe Le', total: 8, date: new Date(2026, 10, 9) },
    { id: 1005, customer: 'Ivy Vo', total: 77.25, date: new Date(2026, 10, 12) },
  ];
}
