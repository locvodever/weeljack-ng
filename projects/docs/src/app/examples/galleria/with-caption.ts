import { Component } from '@angular/core';
import { WjGalleria, WjGalleriaCaptionSlot, WjGalleriaItemSlot } from 'weeljack-ng/galleria';
import { PHOTOS } from './sample-images';

@Component({
  selector: 'docs-galleria-with-caption-example',
  imports: [WjGalleria, WjGalleriaItemSlot, WjGalleriaCaptionSlot],
  template: `
    <wj-galleria [value]="photos" ariaLabel="Walks in the hills, with captions">
      <ng-template wjGalleriaItem [wjGalleriaItemOf]="photos" let-photo>
        <img [src]="photo.src" [alt]="photo.alt" />
      </ng-template>
      <!-- Keep the caption to a title and one line: it covers the bottom of the photo. -->
      <ng-template wjGalleriaCaption [wjGalleriaCaptionOf]="photos" let-photo>
        <span class="title">{{ photo.title }}</span>
        <span class="note">{{ photo.note }}</span>
      </ng-template>
    </wj-galleria>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    img {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .title {
      display: block;
      font-weight: 600;
    }

    .note {
      display: block;
      font-size: 0.875rem;
    }
  `,
})
export class GalleriaWithCaptionExample {
  protected readonly photos = PHOTOS;
}
