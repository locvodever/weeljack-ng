import { Component, signal } from '@angular/core';
import { WjOrderList } from 'weeljack-ng/orderlist';

interface Task {
  id: number;
  name: string;
  owner: string;
}

@Component({
  selector: 'docs-orderlist-filter-example',
  imports: [WjOrderList],
  template: `
    <wj-orderlist
      [(value)]="tasks"
      header="Priority"
      filterBy="name"
      filterPlaceholder="Filter by name"
      ariaFilterLabel="Filter tasks"
      ariaLabel="Tasks, filterable"
    />
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }
  `,
})
export class OrderListFilterExample {
  protected readonly tasks = signal<Task[]>([
    { id: 1, name: 'Write the brief', owner: 'Mia Tran' },
    { id: 2, name: 'Review the plan', owner: 'Noah Pham' },
    { id: 3, name: 'Book the venue', owner: 'Ada Nguyen' },
    { id: 4, name: 'Send the invites', owner: 'Zoe Le' },
    { id: 5, name: 'Order the food', owner: 'Ivy Vo' },
    { id: 6, name: 'Print the signs', owner: 'Kai Dang' },
  ]);
}
