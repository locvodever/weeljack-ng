import { Component, signal } from '@angular/core';
import { WjPickList, WjPickListItemSlot } from 'weeljack-ng/picklist';

interface Column {
  id: number;
  name: string;
  field: string;
}

@Component({
  selector: 'docs-picklist-custom-items-example',
  imports: [WjPickList, WjPickListItemSlot],
  template: `
    <wj-picklist
      [(source)]="available"
      [(target)]="visible"
      sourceHeader="Available columns"
      targetHeader="Visible columns"
      sourceAriaLabel="Available columns, with their field names"
      targetAriaLabel="Visible columns, with their field names"
    >
      <ng-template
        wjPickListItem
        [wjPickListItemOf]="available()"
        let-column
        let-selected="selected"
      >
        <div class="item">
          <div class="name">{{ column.name }}</div>
          <div class="field" [class.picked]="selected">{{ column.field }}</div>
        </div>
      </ng-template>
    </wj-picklist>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 56rem;
    }

    .name {
      font-weight: 600;
    }

    /* The selected row is the preset's highlight, so its second line follows the row's colour. */
    .field:not(.picked) {
      color: var(--wj-text-muted-color);
    }
  `,
})
export class PickListCustomItemsExample {
  protected readonly available = signal<Column[]>([
    { id: 1, name: 'Email', field: 'email' },
    { id: 2, name: 'Phone', field: 'phone' },
    { id: 3, name: 'City', field: 'city' },
    { id: 4, name: 'Country', field: 'country' },
  ]);
  protected readonly visible = signal<Column[]>([
    { id: 6, name: 'Name', field: 'name' },
    { id: 7, name: 'Status', field: 'status' },
  ]);
}
