import { Component } from '@angular/core';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
}

@Component({
  selector: 'docs-table-grouping-example',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table [value]="orders" groupRowsBy="status" ariaLabel="Orders, grouped by status">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
    </wj-table>
  `,
})
export class TableGroupingExample {
  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Mia Tran', status: 'Delivered', total: 120 },
    { id: 1002, customer: 'Noah Pham', status: 'Shipped', total: 45.5 },
    { id: 1003, customer: 'Ada Nguyen', status: 'Pending', total: 300 },
    { id: 1004, customer: 'Zoe Le', status: 'Cancelled', total: 8 },
    { id: 1005, customer: 'Ivy Vo', status: 'Pending', total: 77.25 },
    { id: 1006, customer: 'Leo Dang', status: 'Shipped', total: 64 },
    { id: 1007, customer: 'Eva Bui', status: 'Delivered', total: 210 },
    { id: 1008, customer: 'Max Ho', status: 'Pending', total: 15 },
  ];
}
