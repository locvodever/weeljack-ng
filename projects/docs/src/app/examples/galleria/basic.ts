import { Component } from '@angular/core';
import { WjGalleria, WjGalleriaItemSlot } from 'weeljack-ng/galleria';
import { PHOTOS } from './sample-images';

@Component({
  selector: 'docs-galleria-basic-example',
  imports: [WjGalleria, WjGalleriaItemSlot],
  template: `
    <!-- Render a gallery only when it has photos: with none, Optimus draws an empty box. -->
    @if (photos.length) {
      <wj-galleria [value]="photos" ariaLabel="Walks in the hills">
        <!-- [wjGalleriaItemOf] only types let-photo. The alt says what the photo shows. -->
        <ng-template wjGalleriaItem [wjGalleriaItemOf]="photos" let-photo>
          <img [src]="photo.src" [alt]="photo.alt" />
        </ng-template>
      </wj-galleria>
    } @else {
      <p>No photos yet.</p>
    }
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
  `,
})
export class GalleriaBasicExample {
  protected readonly photos = PHOTOS;
}
