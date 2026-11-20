import { Component, signal } from '@angular/core';
import { WjPickList } from 'weeljack-ng/picklist';

interface Column {
  id: number;
  name: string;
  field: string;
}

@Component({
  selector: 'docs-picklist-filter-example',
  imports: [WjPickList],
  template: `
    <wj-picklist
      [(source)]="available"
      [(target)]="visible"
      sourceHeader="Available columns"
      targetHeader="Visible columns"
      filterBy="name"
      sourceAriaLabel="Available columns"
      targetAriaLabel="Visible columns"
      ariaSourceFilterLabel="Filter available columns"
      ariaTargetFilterLabel="Filter visible columns"
    />
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 56rem;
    }
  `,
})
export class PickListFilterExample {
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
}
