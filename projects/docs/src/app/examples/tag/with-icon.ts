import { Component } from '@angular/core';
import { WjIcon, wjIconCheck } from 'weeljack-ng/icon';
import { WjTag } from 'weeljack-ng/tag';

@Component({
  selector: 'docs-tag-with-icon-example',
  imports: [WjTag, WjIcon],
  template: `
    <wj-tag value="Verified" severity="success">
      <wj-icon [icon]="check" />
    </wj-tag>
  `,
})
export class TagWithIconExample {
  protected readonly check = wjIconCheck;
}
