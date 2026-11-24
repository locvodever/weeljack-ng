import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjIcon, wjIconSave, wjIconSettings } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-button-with-icon-example',
  imports: [WjButton, WjIcon],
  template: `
    <wj-button label="Save"><wj-icon [icon]="save" /></wj-button>
    <wj-button ariaLabel="Settings"><wj-icon [icon]="settings" /></wj-button>
  `,
})
export class ButtonWithIconExample {
  protected readonly save = wjIconSave;
  protected readonly settings = wjIconSettings;
}
