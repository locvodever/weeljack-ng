import { Component } from '@angular/core';
import { WjImage } from 'weeljack-ng/image';
import { BAND_STRIPES } from './sample-images';

@Component({
  selector: 'docs-image-decorative-example',
  imports: [WjImage],
  template: `
    <!-- alt="" marks the band decorative: the sentence below carries the meaning. -->
    <wj-image [src]="band" alt="" width="320" height="80" />
    <p class="text">Your changes are saved automatically while you work.</p>
  `,
  styles: `
    .text {
      margin: 8px 0 0;
    }
  `,
})
export class ImageDecorativeExample {
  protected readonly band = BAND_STRIPES;
}
