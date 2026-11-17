import { Component } from '@angular/core';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
}

/** 23 generated orders, so the last page is short. */
function generateOrders(count: number): Order[] {
  const customers = ['Mia Tran', 'Noah Pham', 'Ada Nguyen', 'Zoe Le', 'Ivy Vo'];
  return Array.from({ length: count }, (_unused, index) => ({
    id: 1001 + index,
    customer: customers[index % customers.length] ?? '',
    total: 20 + ((index * 37) % 280),
  }));
}

@Component({
  selector: 'docs-table-paging-example',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table
      [value]="orders"
      paginator
      [rows]="5"
      [rowsPerPageOptions]="[5, 10, 20]"
      ariaLabel="Orders, paged"
    >
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
    </wj-table>
  `,
})
export class TablePagingExample {
  protected readonly orders = generateOrders(23);
}
