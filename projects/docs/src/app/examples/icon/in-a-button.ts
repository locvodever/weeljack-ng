import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjIcon, wjIconPlus } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-icon-in-a-button-example',
  imports: [WjButton, WjIcon],
  template: `
    <wj-button label="Add"><wj-icon [icon]="plus" /></wj-button>
    <wj-button label="Add" variant="outlined"><wj-icon [icon]="plus" /></wj-button>
  `,
})
export class IconInAButtonExample {
  protected readonly plus = wjIconPlus;
}
