import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjIcon, wjIconTrash } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-icon-icon-only-button-example',
  imports: [WjButton, WjIcon],
  template: `
    <wj-button ariaLabel="Delete" severity="danger"><wj-icon [icon]="trash" /></wj-button>
  `,
})
export class IconOnlyButtonExample {
  protected readonly trash = wjIconTrash;
}
