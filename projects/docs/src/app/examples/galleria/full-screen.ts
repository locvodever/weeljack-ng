import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjGalleria, WjGalleriaItemSlot } from 'weeljack-ng/galleria';
import { PHOTOS } from './sample-images';

@Component({
  selector: 'docs-galleria-full-screen-example',
  imports: [WjButton, WjGalleria, WjGalleriaItemSlot],
  template: `
    <wj-button
      label="View photos"
      size="small"
      severity="secondary"
      variant="outlined"
      (click)="visible.set(true)"
    />
    <!-- fullScreen shows the gallery over the page while visible is true. Focus goes back to the button. -->
    <wj-galleria
      [value]="photos"
      [(visible)]="visible"
      fullScreen
      ariaLabel="Walks in the hills, full screen"
    >
      <ng-template wjGalleriaItem [wjGalleriaItemOf]="photos" let-photo>
        <img [src]="photo.src" [alt]="photo.alt" />
      </ng-template>
    </wj-galleria>
  `,
  styles: `
    img {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }
  `,
})
export class GalleriaFullScreenExample {
  protected readonly photos = PHOTOS;
  protected readonly visible = signal(false);
}
