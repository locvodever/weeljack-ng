import { Component, signal } from '@angular/core';
import { WjImage } from 'weeljack-ng/image';
import { SCENE_HILL } from './sample-images';

@Component({
  selector: 'docs-image-preview-example',
  imports: [WjImage],
  template: `
    <wj-image
      [src]="scene"
      alt="A green hill under a yellow sun"
      width="320"
      height="240"
      preview
      (opened)="state.set('Preview open')"
      (closed)="state.set('Preview closed')"
    />
    <p class="state" role="status">{{ state() }}</p>
  `,
  styles: `
    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ImagePreviewExample {
  protected readonly scene = SCENE_HILL;
  protected readonly state = signal('Preview closed');
}
