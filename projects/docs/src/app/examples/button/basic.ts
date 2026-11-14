import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-button-basic-example',
  imports: [WjButton],
  template: `<wj-button label="Save" />`,
})
export class ButtonBasicExample {}
