import { Component } from '@angular/core';
import { WjScroller, WjScrollerItemSlot, type WjScrollerPt } from 'weeljack-ng/scroller';

interface Tile {
  id: number;
  label: string;
}

@Component({
  selector: 'docs-scroller-horizontal-example',
  imports: [WjScroller, WjScrollerItemSlot],
  template: `
    <wj-scroller
      [items]="tiles"
      [itemSize]="120"
      orientation="horizontal"
      scrollHeight="6rem"
      ariaLabel="One thousand tiles"
      [pt]="pt"
    >
      <ng-template
        wjScrollerItem
        [wjScrollerItemOf]="tiles"
        let-tile
        let-index="index"
        let-count="count"
      >
        <div
          class="tile"
          role="listitem"
          [attr.aria-setsize]="count"
          [attr.aria-posinset]="index + 1"
        >
          {{ tile.label }}
        </div>
      </ng-template>
    </wj-scroller>
  `,
  styles: `
    .tile {
      box-sizing: border-box;
      inline-size: 120px;
      block-size: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-inline-end: 1px solid var(--wj-content-border-color);
    }
  `,
})
export class ScrollerHorizontalExample {
  protected readonly tiles: Tile[] = Array.from({ length: 1000 }, (_unused, index) => ({
    id: index + 1,
    label: `Tile ${(index + 1).toLocaleString('en-US')}`,
  }));
  protected readonly pt: WjScrollerPt = { content: { role: 'list' } };
}
