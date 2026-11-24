import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-getting-started-first-component-example',
  imports: [WjButton],
  template: `<wj-button label="Save" />`,
})
export class GettingStartedFirstComponentExample {}
