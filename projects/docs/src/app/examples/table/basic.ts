import { Component } from '@angular/core';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  date: Date;
}

@Component({
  selector: 'docs-table-basic-example',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table [value]="orders" ariaLabel="Orders">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="status" header="Status" />
    </wj-table>
  `,
})
export class TableBasicExample {
  protected readonly orders: Order[] = [
    {
      id: 1001,
      customer: 'Mia Tran',
      status: 'Delivered',
      total: 120,
      date: new Date(2026, 9, 28),
    },
    {
      id: 1002,
      customer: 'Noah Pham',
      status: 'Shipped',
      total: 45.5,
      date: new Date(2026, 10, 2),
    },
    {
      id: 1003,
      customer: 'Ada Nguyen',
      status: 'Pending',
      total: 300,
      date: new Date(2026, 10, 5),
    },
    { id: 1004, customer: 'Zoe Le', status: 'Cancelled', total: 8, date: new Date(2026, 10, 9) },
    { id: 1005, customer: 'Ivy Vo', status: 'Pending', total: 77.25, date: new Date(2026, 10, 12) },
  ];
}
