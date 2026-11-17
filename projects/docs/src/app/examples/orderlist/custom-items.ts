import { Component, signal } from '@angular/core';
import { WjOrderList, WjOrderListItemSlot } from 'weeljack-ng/orderlist';

interface Task {
  id: number;
  name: string;
  owner: string;
}

@Component({
  selector: 'docs-orderlist-custom-items-example',
  imports: [WjOrderList, WjOrderListItemSlot],
  template: `
    <wj-orderlist [(value)]="tasks" header="Priority" ariaLabel="Tasks with their owners">
      <ng-template wjOrderListItem [wjOrderListItemOf]="tasks()" let-task let-selected="selected">
        <div class="item">
          <div class="name">{{ task.name }}</div>
          <div class="owner" [class.picked]="selected">{{ task.owner }}</div>
        </div>
      </ng-template>
    </wj-orderlist>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .name {
      font-weight: 600;
    }

    /* The selected row is the preset's highlight, so its second line follows the row's colour. */
    .owner:not(.picked) {
      color: var(--wj-text-muted-color);
    }
  `,
})
export class OrderListCustomItemsExample {
  protected readonly tasks = signal<Task[]>([
    { id: 1, name: 'Write the brief', owner: 'Mia Tran' },
    { id: 2, name: 'Review the plan', owner: 'Noah Pham' },
    { id: 3, name: 'Book the venue', owner: 'Ada Nguyen' },
    { id: 4, name: 'Send the invites', owner: 'Zoe Le' },
    { id: 5, name: 'Order the food', owner: 'Ivy Vo' },
    { id: 6, name: 'Print the signs', owner: 'Kai Dang' },
  ]);
}
