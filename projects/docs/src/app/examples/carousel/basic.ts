import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { WjCarousel, WjCarouselItemSlot } from 'weeljack-ng/carousel';
import { SCENES } from './sample-images';

interface Product {
  name: string;
  price: number;
  scene: string;
}

const NAMES = ['Desk lamp', 'Notebook', 'Water bottle', 'Backpack', 'Keyboard', 'Headphones'];

@Component({
  selector: 'docs-carousel-basic-example',
  imports: [WjCarousel, WjCarouselItemSlot, CurrencyPipe],
  template: `
    <!-- Render a carousel only when it has items: with none, Optimus draws two buttons around nothing. -->
    @if (products.length) {
      <wj-carousel [value]="products" ariaLabel="Featured products">
        <!-- [wjCarouselItemOf] only types let-product. A real app links the name to the product. -->
        <ng-template wjCarouselItem [wjCarouselItemOf]="products" let-product>
          <div class="card">
            <img [src]="product.scene" alt="" width="320" height="240" />
            <a class="name" href="#examples" (click)="$event.preventDefault()">{{
              product.name
            }}</a>
            <div class="price">{{ product.price | currency: 'USD' : 'symbol' : '1.0-0' }}</div>
          </div>
        </ng-template>
      </wj-carousel>
    } @else {
      <p>No products yet.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .card {
      box-sizing: border-box;
      block-size: 100%;
      inline-size: calc(100% - 16px);
      max-inline-size: 20rem;
      margin-inline: auto;
      padding: 16px;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
    }

    img {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: 8px;
    }

    .name {
      display: block;
      margin-block-start: 12px;
      font-weight: 600;
    }

    .price {
      margin-block-start: 8px;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class CarouselBasicExample {
  protected readonly products: Product[] = NAMES.map((name, index) => ({
    name,
    price: 12 + ((index * 17) % 90),
    scene: SCENES[index]?.src ?? '',
  }));
}
