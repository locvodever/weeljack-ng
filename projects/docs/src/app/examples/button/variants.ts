import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-button-variants-example',
  imports: [WjButton],
  template: `
    <wj-button label="Solid" />
    <wj-button label="Outlined" variant="outlined" />
    <wj-button label="Text" variant="text" />
  `,
})
export class ButtonVariantsExample {}
