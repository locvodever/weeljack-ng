import { Component } from '@angular/core';
import { WjTooltip } from 'weeljack-ng/tooltip';

@Component({
  selector: 'docs-tooltip-basic-example',
  imports: [WjTooltip],
  template: `
    <button type="button" class="native" wjTooltip="Downloads the current view as a CSV file.">
      Export
    </button>
  `,
  styles: `
    .native {
      font: inherit;
      min-block-size: 44px;
      padding: 0 16px;
      border: 1px solid var(--wj-form-field-border-color);
      border-radius: 8px;
      background: var(--wj-content-background);
      color: var(--wj-text-color);
      cursor: pointer;
    }
  `,
})
export class TooltipBasicExample {}
