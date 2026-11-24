import { Component } from '@angular/core';
import { WjGalleria, WjGalleriaItemSlot, WjGalleriaThumbnailSlot } from 'weeljack-ng/galleria';
import { PHOTOS } from './sample-images';

@Component({
  selector: 'docs-galleria-thumbnails-example',
  imports: [WjGalleria, WjGalleriaItemSlot, WjGalleriaThumbnailSlot],
  template: `
    <wj-galleria
      [value]="photos"
      [numVisible]="4"
      [showThumbnails]="true"
      thumbnailsPosition="bottom"
      ariaLabel="Walks in the hills, with thumbnails"
    >
      <ng-template wjGalleriaItem [wjGalleriaItemOf]="photos" let-photo>
        <img class="photo" [src]="photo.src" [alt]="photo.alt" />
      </ng-template>
      <!-- Optimus names each thumbnail "Page N", so the thumbnail image has an empty alt. -->
      <ng-template wjGalleriaThumbnail [wjGalleriaThumbnailOf]="photos" let-photo>
        <img class="thumb" [src]="photo.src" alt="" />
      </ng-template>
    </wj-galleria>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .photo {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .thumb {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }
  `,
})
export class GalleriaThumbnailsExample {
  protected readonly photos = PHOTOS;
}
