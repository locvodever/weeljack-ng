import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  WjCarousel,
  WjCarouselItemSlot,
  type WjCarouselResponsiveOption,
} from 'weeljack-ng/carousel';
import { SCENES } from './sample-images';

interface Product {
  name: string;
  price: number;
  scene: string;
}

const NAMES = ['Desk lamp', 'Notebook', 'Water bottle', 'Backpack', 'Keyboard', 'Headphones'];

@Component({
  selector: 'docs-carousel-responsive-example',
  imports: [WjCarousel, WjCarouselItemSlot, CurrencyPipe],
  template: `
    @if (products.length) {
      <!-- Three cards, two below a 1024 px window and one below 640 px: the breakpoints follow the window. -->
      <wj-carousel
        [value]="products"
        [numVisible]="3"
        [numScroll]="3"
        [responsiveOptions]="responsiveOptions"
        ariaLabel="Featured products, responsive"
      >
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
    }

    .card {
      box-sizing: border-box;
      block-size: 100%;
      margin-inline: 8px;
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
export class CarouselResponsiveExample {
  protected readonly responsiveOptions: WjCarouselResponsiveOption[] = [
    { breakpoint: '1024px', numVisible: 2, numScroll: 2 },
    { breakpoint: '640px', numVisible: 1, numScroll: 1 },
  ];

  protected readonly products: Product[] = NAMES.map((name, index) => ({
    name,
    price: 12 + ((index * 17) % 90),
    scene: SCENES[index]?.src ?? '',
  }));
}
