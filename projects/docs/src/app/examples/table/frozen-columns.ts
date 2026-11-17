import { Component } from '@angular/core';
import { WjColumn, WjTable } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  status: string;
  carrier: string;
  shipTo: string;
  placed: string;
  items: number;
  total: number;
}

@Component({
  selector: 'docs-table-frozen-columns-example',
  imports: [WjTable, WjColumn],
  template: `
    <wj-table
      [value]="orders"
      scrollHeight="20rem"
      ariaLabel="Orders, with the first and last columns frozen"
    >
      <wj-column field="id" header="Order" frozen />
      <wj-column field="customer" header="Customer" />
      <wj-column field="status" header="Status" />
      <wj-column field="carrier" header="Carrier" />
      <wj-column field="shipTo" header="Ship to" />
      <wj-column field="placed" header="Placed" />
      <wj-column field="items" header="Items" />
      <wj-column field="total" header="Total" frozen alignFrozen="right" />
    </wj-table>
  `,
  styles: `
    /* Cells never wrap here, so the columns are wider than the panel and the table scrolls. */
    :host ::ng-deep td,
    :host ::ng-deep th {
      white-space: nowrap;
    }
  `,
})
export class TableFrozenColumnsExample {
  protected readonly orders: Order[] = [
    {
      id: 1001,
      customer: 'Mia Tran',
      status: 'Delivered',
      carrier: 'Harbour Freight',
      shipTo: '12 Harbour Street, Da Nang',
      placed: '28 Oct 2026',
      items: 3,
      total: 120,
    },
    {
      id: 1002,
      customer: 'Noah Pham',
      status: 'Shipped',
      carrier: 'Red River Courier',
      shipTo: '8 Lake Road, Hanoi',
      placed: '2 Nov 2026',
      items: 1,
      total: 45.5,
    },
    {
      id: 1003,
      customer: 'Ada Nguyen',
      status: 'Pending',
      carrier: 'Harbour Freight',
      shipTo: '3 Garden Lane, Hue',
      placed: '5 Nov 2026',
      items: 1,
      total: 300,
    },
    {
      id: 1004,
      customer: 'Zoe Le',
      status: 'Cancelled',
      carrier: 'Red River Courier',
      shipTo: '21 Station Avenue, Can Tho',
      placed: '9 Nov 2026',
      items: 2,
      total: 8,
    },
    {
      id: 1005,
      customer: 'Ivy Vo',
      status: 'Pending',
      carrier: 'Harbour Freight',
      shipTo: '5 Market Square, Hai Phong',
      placed: '12 Nov 2026',
      items: 4,
      total: 77.25,
    },
    {
      id: 1006,
      customer: 'Leo Dang',
      status: 'Shipped',
      carrier: 'Red River Courier',
      shipTo: '17 Orchard Close, Nha Trang',
      placed: '13 Nov 2026',
      items: 2,
      total: 64,
    },
    {
      id: 1007,
      customer: 'Eva Bui',
      status: 'Delivered',
      carrier: 'Harbour Freight',
      shipTo: '9 Canal Walk, Hoi An',
      placed: '14 Nov 2026',
      items: 5,
      total: 210,
    },
    {
      id: 1008,
      customer: 'Max Ho',
      status: 'Pending',
      carrier: 'Red River Courier',
      shipTo: '2 Pine Court, Da Lat',
      placed: '15 Nov 2026',
      items: 1,
      total: 15,
    },
  ];
}
