import { Component, signal } from '@angular/core';
import type { WjLazyLoadEvent } from 'weeljack-ng';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
}

/** 120 simulated orders: the "server" side of this example. */
function generateOrders(count: number): Order[] {
  const customers = ['Mia Tran', 'Noah Pham', 'Ada Nguyen', 'Zoe Le', 'Ivy Vo'];
  return Array.from({ length: count }, (_unused, index) => ({
    id: 1001 + index,
    customer: customers[index % customers.length] ?? '',
    total: 20 + ((index * 37) % 280),
  }));
}

@Component({
  selector: 'docs-table-lazy-loading-example',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table
      [value]="page()"
      lazy
      paginator
      [rows]="5"
      [totalRecords]="server.length"
      [loading]="loading()"
      (lazyLoad)="load($event)"
      ariaLabel="Orders, loaded page by page"
    >
      <wj-column field="id" header="Order" sortable />
      <wj-column field="customer" header="Customer" sortable />
      <wj-column field="total" header="Total" sortable />
    </wj-table>
  `,
})
export class TableLazyLoadingExample {
  protected readonly server = generateOrders(120);
  protected readonly page = signal<Order[]>([]);
  protected readonly loading = signal(false);
  private started = false;

  /** Answers a request from the table: the first at once, the rest after about 400 ms. */
  protected load(request: WjLazyLoadEvent): void {
    const answer = (): void => {
      const field =
        request.sortField === 'customer' || request.sortField === 'total'
          ? request.sortField
          : 'id';
      const sorted = [...this.server].sort((a, b) => {
        const order = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
        return order * request.sortOrder;
      });
      this.page.set(sorted.slice(request.first, request.first + (request.rows ?? 5)));
      this.loading.set(false);
    };
    if (!this.started) {
      // The table asks while it starts: answer a moment later, not while it is being checked.
      this.started = true;
      queueMicrotask(answer);
      return;
    }
    this.loading.set(true);
    setTimeout(answer, 400);
  }
}
