import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjColumn, WjTable, WjTableCaptionSlot } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
}

@Component({
  selector: 'docs-table-filters-example',
  imports: [WjTable, WjColumn, WjTableCaptionSlot, WjField, WjInputText],
  template: `
    <wj-table
      #byRow
      [value]="orders"
      [globalFilterFields]="['customer', 'status']"
      ariaLabel="Orders, filtered in a row"
    >
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" filterType="text" />
      <wj-column field="status" header="Status" filterType="text" />
      <wj-column field="total" header="Total" filterType="numeric" />
      <ng-template wjTableCaption>
        <wj-field label="Search orders">
          <input wjInputText #query (input)="byRow.filterGlobal(query.value)" />
        </wj-field>
      </ng-template>
    </wj-table>

    <wj-table [value]="orders" filterDisplay="menu" ariaLabel="Orders, filtered in a menu">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" filterType="text" />
      <wj-column field="total" header="Total" filterType="numeric" />
    </wj-table>
  `,
  styles: `
    :host {
      display: grid;
      gap: 24px;
    }
  `,
})
export class TableFiltersExample {
  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Mia Tran', status: 'Delivered', total: 120 },
    { id: 1002, customer: 'Noah Pham', status: 'Shipped', total: 45.5 },
    { id: 1003, customer: 'Ada Nguyen', status: 'Pending', total: 300 },
    { id: 1004, customer: 'Zoe Le', status: 'Cancelled', total: 8 },
    { id: 1005, customer: 'Ivy Vo', status: 'Pending', total: 77.25 },
  ];
}
