import { Component } from '@angular/core';
import { WjScroller, WjScrollerItemSlot, type WjScrollerPt } from 'weeljack-ng/scroller';

interface Item {
  id: number;
  name: string;
}

@Component({
  selector: 'docs-scroller-basic-example',
  imports: [WjScroller, WjScrollerItemSlot],
  template: `
    <wj-scroller
      [items]="items"
      [itemSize]="48"
      scrollHeight="20rem"
      ariaLabel="Ten thousand items"
      [pt]="pt"
    >
      <ng-template
        wjScrollerItem
        [wjScrollerItemOf]="items"
        let-item
        let-index="index"
        let-count="count"
      >
        <div
          class="item"
          role="listitem"
          [attr.aria-setsize]="count"
          [attr.aria-posinset]="index + 1"
        >
          {{ item.name }}
        </div>
      </ng-template>
    </wj-scroller>
  `,
  styles: `
    .item {
      box-sizing: border-box;
      block-size: 48px;
      display: flex;
      align-items: center;
      padding-inline: 16px;
      border-block-end: 1px solid var(--wj-content-border-color);
    }
  `,
})
export class ScrollerBasicExample {
  protected readonly items: Item[] = Array.from({ length: 10_000 }, (_unused, index) => ({
    id: index + 1,
    name: `Item ${(index + 1).toLocaleString('en-US')}`,
  }));
  /** The content part is the list, and each item is a list item. */
  protected readonly pt: WjScrollerPt = { content: { role: 'list' } };
}
