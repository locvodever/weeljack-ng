import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-button-disabled-example',
  imports: [WjButton],
  template: `<wj-button label="Save" disabled />`,
})
export class ButtonDisabledExample {}
