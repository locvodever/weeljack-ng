import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-button-loading-example',
  imports: [WjButton],
  template: `<wj-button label="Saving" loading />`,
})
export class ButtonLoadingExample {}
