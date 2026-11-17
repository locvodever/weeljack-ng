import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  WjScroller,
  WjScrollerItemSlot,
  WjScrollerLoaderSlot,
  type WjScrollerPt,
  type WjScrollerRange,
} from 'weeljack-ng/scroller';
import { WjSkeleton } from 'weeljack-ng/skeleton';

interface Item {
  id: number;
  name: string;
}

const CHUNK = 50;

@Component({
  selector: 'docs-scroller-lazy-loading-example',
  imports: [WjScroller, WjScrollerItemSlot, WjScrollerLoaderSlot, WjSkeleton],
  template: `
    <wj-scroller
      [items]="items()"
      [itemSize]="48"
      scrollHeight="20rem"
      ariaLabel="Items loaded as you scroll"
      lazy
      [loading]="loading()"
      [pt]="pt"
      (lazyLoad)="load($event)"
    >
      <ng-template wjScrollerItem [wjScrollerItemOf]="items()" let-item>
        <div class="item" role="listitem">
          @if (item) {
            {{ item.name }}
          } @else {
            <wj-skeleton width="60%" />
          }
        </div>
      </ng-template>
      <ng-template wjScrollerLoader>
        <div class="item"><wj-skeleton width="60%" /></div>
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
export class ScrollerLazyLoadingExample {
  /** One slot per item the server has, empty until its chunk arrives. */
  protected readonly items = signal<(Item | undefined)[]>(
    Array.from({ length: 1000 }, () => undefined),
  );
  protected readonly loading = signal(false);
  protected readonly pt: WjScrollerPt = { content: { role: 'list' } };
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  /** Loads the chunks of 50 that cover the range, as a server would answer after a moment. */
  protected load(range: WjScrollerRange): void {
    this.loading.set(true);
    const from = Math.floor(range.first / CHUNK) * CHUNK;
    const to = Math.ceil(range.last / CHUNK) * CHUNK;
    this.timer = setTimeout(() => {
      // A new array, so the scroller sees the change.
      const next = [...this.items()];
      for (let index = from; index < Math.min(to, next.length); index++) {
        next[index] = { id: index + 1, name: `Item ${(index + 1).toLocaleString('en-US')}` };
      }
      this.items.set(next);
      this.loading.set(false);
    }, 600);
  }
}
