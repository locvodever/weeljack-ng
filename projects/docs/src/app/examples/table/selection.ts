import { Component, computed, signal } from '@angular/core';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
}

const ORDERS: Order[] = [
  { id: 1001, customer: 'Mia Tran', status: 'Delivered', total: 120 },
  { id: 1002, customer: 'Noah Pham', status: 'Shipped', total: 45.5 },
  { id: 1003, customer: 'Ada Nguyen', status: 'Pending', total: 300 },
  { id: 1004, customer: 'Zoe Le', status: 'Cancelled', total: 8 },
  { id: 1005, customer: 'Ivy Vo', status: 'Pending', total: 77.25 },
];

@Component({
  selector: 'docs-table-selection-example',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table
      [value]="orders"
      selectionMode="single"
      dataKey="id"
      [(selection)]="picked"
      ariaLabel="Orders, one can be selected"
    >
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="status" header="Status" />
    </wj-table>
    <p class="state">{{ pickedText() }}</p>

    <wj-table
      [value]="orders"
      selectionMode="multiple"
      dataKey="id"
      [(selection)]="chosen"
      ariaLabel="Orders, many can be selected"
    >
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="status" header="Status" />
    </wj-table>
    <p class="state">{{ chosenText() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 24px;
    }

    .state {
      margin: -16px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TableSelectionExample {
  protected readonly orders = ORDERS;

  /** Always an array: in single mode it holds at most one row. */
  protected readonly picked = signal<Order[]>([]);
  protected readonly chosen = signal<Order[]>(
    ORDERS.filter((order) => order.id === 1002 || order.id === 1004),
  );

  protected readonly pickedText = computed(() => this.describe(this.picked()));
  protected readonly chosenText = computed(() => this.describe(this.chosen()));

  private describe(rows: Order[]): string {
    return rows.length === 0
      ? 'Nothing selected'
      : `Selected: ${rows.map((row) => row.id).join(', ')}`;
  }
}
