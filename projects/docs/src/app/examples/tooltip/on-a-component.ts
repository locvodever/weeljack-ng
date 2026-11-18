import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjTooltip } from 'weeljack-ng/tooltip';

@Component({
  selector: 'docs-tooltip-on-a-component-example',
  imports: [WjButton, WjTooltip],
  template: `
    <wj-button
      label="Archive"
      severity="secondary"
      variant="outlined"
      #tip="wjTooltip"
      wjTooltip="Moves it out of your inbox. You can restore it later."
      [ariaDescribedBy]="tip.descriptionId"
    />
  `,
})
export class TooltipOnAComponentExample {}
