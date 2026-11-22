import { Component } from '@angular/core';
import { WjIcon, wjIconTriangleExclamationPoint } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-icon-labelled-example',
  imports: [WjIcon],
  template: `
    <p>
      <wj-icon [icon]="warning" label="Warning" />
      Your changes have not been saved.
    </p>
  `,
  styles: `
    p {
      margin: 0;
    }
  `,
})
export class IconLabelledExample {
  protected readonly warning = wjIconTriangleExclamationPoint;
}
