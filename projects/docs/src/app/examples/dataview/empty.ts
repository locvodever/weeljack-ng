import { Component } from '@angular/core';
import { WjDataView, WjDataViewEmptySlot, WjDataViewItemSlot } from 'weeljack-ng/dataview';

interface Product {
  id: number;
  name: string;
}

@Component({
  selector: 'docs-dataview-empty-example',
  imports: [WjDataView, WjDataViewItemSlot, WjDataViewEmptySlot],
  template: `
    <wj-dataview [value]="products" ariaLabel="Matching products">
      <ng-template wjDataViewItem [wjDataViewItemOf]="products" let-product>
        {{ product.name }}
      </ng-template>
      <ng-template wjDataViewEmpty>No products match.</ng-template>
    </wj-dataview>
  `,
})
export class DataViewEmptyExample {
  protected readonly products: Product[] = [];
}
