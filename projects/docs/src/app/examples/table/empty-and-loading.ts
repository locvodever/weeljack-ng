import { Component } from '@angular/core';
import { WjSkeleton } from 'weeljack-ng/skeleton';
import { WjColumn, WjTable, WjTableEmptySlot, WjTableLoadingSlot } from 'weeljack-ng/table';

@Component({
  selector: 'docs-table-empty-and-loading-example',
  imports: [WjTable, WjColumn, WjTableEmptySlot, WjTableLoadingSlot, WjSkeleton],
  template: `
    <wj-table [value]="[]" ariaLabel="Orders, none yet">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
      <ng-template wjTableEmpty>No orders yet.</ng-template>
    </wj-table>

    <wj-table [value]="[]" loading ariaLabel="Orders, loading">
      <wj-column field="id" header="Order" />
      <wj-column field="customer" header="Customer" />
      <wj-column field="total" header="Total" />
      <ng-template wjTableLoading>
        <div class="lines">
          <wj-skeleton />
          <wj-skeleton />
          <wj-skeleton width="60%" />
        </div>
      </ng-template>
    </wj-table>
  `,
  styles: `
    :host {
      display: grid;
      gap: 24px;
    }

    .lines {
      display: grid;
      gap: 8px;
    }
  `,
})
export class TableEmptyAndLoadingExample {}
