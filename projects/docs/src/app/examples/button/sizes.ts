import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-button-sizes-example',
  imports: [WjButton],
  template: `
    <wj-button label="Small" size="small" />
    <wj-button label="Default" />
    <wj-button label="Large" size="large" />
  `,
})
export class ButtonSizesExample {}
