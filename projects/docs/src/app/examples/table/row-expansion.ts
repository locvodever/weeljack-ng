import { Component } from '@angular/core';
import { WjColumn, WjTable, WjTableRowExpansionSlot } from 'weeljack-ng/table';

interface Order {
  id: number;
  customer: string;
  total: number;
  items: string;
  shipTo: string;
  note: string;
}

@Component({
  selector: 'docs-table-row-expansion-example',
  imports: [WjTable, WjColumn, WjTableRowExpansionSlot],
  template: `
    <wj-table [value]="orders" dataKey="id" ariaLabel="Orders with details">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
      <ng-template wjTableRowExpansion [wjTableRowExpansionOf]="orders" let-order>
        <dl class="details">
          <dt>Items</dt>
          <dd>{{ order.items }}</dd>
          <dt>Ship to</dt>
          <dd>{{ order.shipTo }}</dd>
          <dt>Note</dt>
          <dd>{{ order.note }}</dd>
        </dl>
      </ng-template>
    </wj-table>
  `,
  styles: `
    .details {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 0;
    }

    dt {
      font-weight: 600;
    }

    dd {
      margin: 0;
    }
  `,
})
export class TableRowExpansionExample {
  protected readonly orders: Order[] = [
    {
      id: 1001,
      customer: 'Mia Tran',
      total: 120,
      items: '2 desk lamps, 1 cable kit',
      shipTo: '12 Harbour Street, Da Nang',
      note: 'Leave with the front desk.',
    },
    {
      id: 1002,
      customer: 'Noah Pham',
      total: 45.5,
      items: '1 notebook set',
      shipTo: '8 Lake Road, Hanoi',
      note: 'None.',
    },
    {
      id: 1003,
      customer: 'Ada Nguyen',
      total: 300,
      items: '1 standing desk',
      shipTo: '3 Garden Lane, Hue',
      note: 'Call before delivery.',
    },
  ];
}
