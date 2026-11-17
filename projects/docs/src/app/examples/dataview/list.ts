import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { WjDataView, WjDataViewItemSlot } from 'weeljack-ng/dataview';

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
}

const NAMES = ['Desk lamp', 'Notebook', 'Water bottle', 'Backpack', 'Keyboard', 'Headphones'];
const CATEGORIES = ['Home', 'Stationery', 'Outdoors', 'Travel', 'Office', 'Audio'];

/** Generated products, so the example never waits on a server. */
function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: index + 1,
    name: `${NAMES[index % NAMES.length] ?? ''} ${String(index + 1)}`,
    category: CATEGORIES[index % CATEGORIES.length] ?? '',
    description: 'Made to last, and easy to look after.',
    price: 12 + ((index * 17) % 90),
  }));
}

@Component({
  selector: 'docs-dataview-list-example',
  imports: [WjDataView, WjDataViewItemSlot, CurrencyPipe],
  template: `
    <wj-dataview [value]="products" ariaLabel="Products">
      <ng-template wjDataViewItem [wjDataViewItemOf]="products" let-product let-index="index">
        <div class="item" [class.divided]="index > 0">
          <div>
            <div class="name">{{ product.name }}</div>
            <div class="category">{{ product.category }}</div>
          </div>
          <div class="price">{{ product.price | currency: 'USD' : 'symbol' : '1.0-0' }}</div>
        </div>
      </ng-template>
    </wj-dataview>
  `,
  styles: `
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-block: 16px;
    }

    .divided {
      border-block-start: 1px solid var(--wj-content-border-color);
    }

    .name {
      font-weight: 600;
    }

    .category {
      color: var(--wj-text-muted-color);
    }
  `,
})
export class DataViewListExample {
  protected readonly products = makeProducts(6);
}
