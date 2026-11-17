import { Component, computed, signal } from '@angular/core';
import { WjPaginator } from 'weeljack-ng/paginator';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
}

/** 47 generated orders, so the last page is short. */
function generateOrders(count: number): Order[] {
  const customers = ['Mia Tran', 'Noah Pham', 'Ada Nguyen', 'Zoe Le', 'Ivy Vo'];
  return Array.from({ length: count }, (_unused, index) => ({
    id: 1001 + index,
    customer: customers[index % customers.length] ?? '',
    total: 20 + ((index * 37) % 280),
  }));
}

/**
 * The table's own pager is off, so the table shows the rows it is given: this app gives it the
 * current page, cut from the `first` and `rows` the paginator writes.
 */
@Component({
  selector: 'docs-paginator-beside-a-table-example',
  imports: [WjPaginator, WjTable, WjColumn],
  template: `
    <wj-table [value]="page()" ariaLabel="Orders">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
    </wj-table>
    <wj-paginator
      [totalRecords]="orders.length"
      [(first)]="first"
      [(rows)]="rows"
      [rowsPerPageOptions]="[5, 10, 20]"
      showCurrentPageReport
      currentPageReportTemplate="{first}–{last} of {totalRecords}"
      ariaLabel="Orders pages"
    />
  `,
})
export class PaginatorBesideATableExample {
  protected readonly orders = generateOrders(47);
  protected readonly first = signal(0);
  protected readonly rows = signal(5);
  protected readonly page = computed(() =>
    this.orders.slice(this.first(), this.first() + this.rows()),
  );
}
