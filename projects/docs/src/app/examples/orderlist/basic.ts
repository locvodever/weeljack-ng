import { Component, computed, signal } from '@angular/core';
import { WjOrderList } from 'weeljack-ng/orderlist';

interface Task {
  id: number;
  name: string;
  owner: string;
}

@Component({
  selector: 'docs-orderlist-basic-example',
  imports: [WjOrderList],
  template: `
    <wj-orderlist [(value)]="tasks" [(selection)]="picked" header="Priority" ariaLabel="Tasks" />
    <p class="state">{{ orderText() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class OrderListBasicExample {
  /** Every move writes a new array here; the array this starts as is never changed. */
  protected readonly tasks = signal<Task[]>([
    { id: 1, name: 'Write the brief', owner: 'Mia Tran' },
    { id: 2, name: 'Review the plan', owner: 'Noah Pham' },
    { id: 3, name: 'Book the venue', owner: 'Ada Nguyen' },
    { id: 4, name: 'Send the invites', owner: 'Zoe Le' },
    { id: 5, name: 'Order the food', owner: 'Ivy Vo' },
    { id: 6, name: 'Print the signs', owner: 'Kai Dang' },
  ]);
  protected readonly picked = signal<Task[]>([]);

  protected readonly orderText = computed(
    () =>
      `Order: ${this.tasks()
        .map((task) => task.name)
        .join(', ')}`,
  );
}
