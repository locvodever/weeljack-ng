import { CurrencyPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { WjDataView, WjDataViewHeaderSlot, WjDataViewItemSlot } from 'weeljack-ng/dataview';
import { WjField } from 'weeljack-ng/field';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';

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
  selector: 'docs-dataview-grid-example',
  imports: [
    WjDataView,
    WjDataViewItemSlot,
    WjDataViewHeaderSlot,
    WjField,
    WjToggleSwitch,
    CurrencyPipe,
  ],
  template: `
    <wj-dataview [value]="products" [layout]="layout()" ariaLabel="Products, with a layout switch">
      <ng-template wjDataViewHeader>
        <wj-field label="Grid view">
          <wj-toggleswitch [(checked)]="grid" />
        </wj-field>
      </ng-template>
      <ng-template wjDataViewItem [wjDataViewItemOf]="products" let-product let-layout="layout">
        <div [class]="layout === 'grid' ? 'card' : 'row'">
          <div class="name">{{ product.name }}</div>
          <div class="category">{{ product.category }}</div>
          <p class="description">{{ product.description }}</p>
          <div class="price">{{ product.price | currency: 'USD' : 'symbol' : '1.0-0' }}</div>
        </div>
      </ng-template>
    </wj-dataview>
  `,
  styles: `
    .card {
      block-size: 100%;
      box-sizing: border-box;
      padding: 16px;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
    }

    .row {
      padding-block: 12px;
      border-block-end: 1px solid var(--wj-content-border-color);
    }

    .name {
      font-weight: 600;
    }

    .category,
    .description {
      margin: 0;
      color: var(--wj-text-muted-color);
    }

    .price {
      margin-block-start: 8px;
      font-weight: 600;
    }
  `,
})
export class DataViewGridExample {
  protected readonly products = makeProducts(6);
  protected readonly grid = signal(true);
  protected readonly layout = computed(() => (this.grid() ? 'grid' : 'list'));
}
