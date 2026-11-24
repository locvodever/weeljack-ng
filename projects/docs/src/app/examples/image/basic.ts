import { Component } from '@angular/core';
import { WjImage } from 'weeljack-ng/image';
import { SCENE_HILL } from './sample-images';

@Component({
  selector: 'docs-image-basic-example',
  imports: [WjImage],
  template: `
    <!-- src and alt are required; width and height reserve the box before the image loads. -->
    <wj-image [src]="scene" alt="A green hill under a yellow sun" width="320" height="240" />
  `,
})
export class ImageBasicExample {
  protected readonly scene = SCENE_HILL;
}
