import { Component } from '@angular/core';
import { WjIcon, wjIconLoaderCircle } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-icon-spin-example',
  imports: [WjIcon],
  template: ` <p role="status"><wj-icon [icon]="loader" spin /> Loading</p> `,
  styles: `
    p {
      margin: 0;
    }
  `,
})
export class IconSpinExample {
  protected readonly loader = wjIconLoaderCircle;
}
