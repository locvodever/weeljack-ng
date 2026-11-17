import { Component, computed, signal } from '@angular/core';
import { WjPickList } from 'weeljack-ng/picklist';

interface Column {
  id: number;
  name: string;
  field: string;
}

@Component({
  selector: 'docs-picklist-basic-example',
  imports: [WjPickList],
  template: `
    <wj-picklist
      [(source)]="available"
      [(target)]="visible"
      sourceHeader="Available columns"
      targetHeader="Visible columns"
      sourceAriaLabel="Available columns"
      targetAriaLabel="Visible columns"
    />
    <p class="state">{{ visibleText() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 56rem;
    }

    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class PickListBasicExample {
  /** Every move writes a new array here; the array this starts as is never changed. */
  protected readonly available = signal<Column[]>([
    { id: 1, name: 'Email', field: 'email' },
    { id: 2, name: 'Phone', field: 'phone' },
    { id: 3, name: 'City', field: 'city' },
    { id: 4, name: 'Country', field: 'country' },
    { id: 5, name: 'Created', field: 'createdAt' },
  ]);
  protected readonly visible = signal<Column[]>([
    { id: 6, name: 'Name', field: 'name' },
    { id: 7, name: 'Status', field: 'status' },
  ]);

  protected readonly visibleText = computed(
    () =>
      `Visible: ${this.visible()
        .map((column) => column.name)
        .join(', ')}`,
  );
}
