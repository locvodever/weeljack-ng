import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WjInputText } from 'weeljack-ng/inputtext';
import {
  WjColumn,
  WjTable,
  WjTableCellEditorSlot,
  type WjTableRowEditEvent,
} from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
}

@Component({
  selector: 'docs-table-row-editing-example',
  imports: [WjTable, WjColumn, WjTableCellEditorSlot, WjInputText, FormsModule],
  template: `
    <wj-table
      [value]="orders"
      dataKey="id"
      ariaLabel="Orders, editable"
      (rowEditInit)="remember($event)"
      (rowEditSave)="forget($event)"
      (rowEditCancel)="restore($event)"
    >
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer">
        <ng-template wjTableCellEditor [wjTableCellEditorOf]="orders" let-order>
          <input
            wjInputText
            size="small"
            class="editor"
            aria-label="Customer"
            required
            [(ngModel)]="order.customer"
          />
        </ng-template>
      </wj-column>
      <wj-column field="total" header="Total">
        <ng-template wjTableCellEditor [wjTableCellEditorOf]="orders" let-order>
          <input
            wjInputText
            size="small"
            class="editor"
            type="number"
            aria-label="Total"
            [(ngModel)]="order.total"
          />
        </ng-template>
      </wj-column>
    </wj-table>
    <p class="note">
      The editors write into the row as you type, so the table's Cancel gives you the row to
      restore: this example keeps a copy when editing starts and puts it back on cancel.
    </p>
  `,
  styles: `
    .editor {
      inline-size: 100%;
    }

    .note {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TableRowEditingExample {
  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Mia Tran', total: 120 },
    { id: 1002, customer: 'Noah Pham', total: 45.5 },
    { id: 1003, customer: 'Ada Nguyen', total: 300 },
  ];

  private readonly originals = new Map<number, Order>();

  protected remember(event: WjTableRowEditEvent<Order>): void {
    this.originals.set(event.row.id, { ...event.row });
  }

  protected forget(event: WjTableRowEditEvent<Order>): void {
    this.originals.delete(event.row.id);
  }

  protected restore(event: WjTableRowEditEvent<Order>): void {
    const original = this.originals.get(event.row.id);
    if (original !== undefined) {
      Object.assign(event.row, original);
    }
    this.originals.delete(event.row.id);
  }
}
