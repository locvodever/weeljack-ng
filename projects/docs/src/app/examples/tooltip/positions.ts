import { Component } from '@angular/core';
import { WjTooltip } from 'weeljack-ng/tooltip';

@Component({
  selector: 'docs-tooltip-positions-example',
  imports: [WjTooltip],
  template: `
    <div class="row">
      <button type="button" class="native" tooltipPosition="left" wjTooltip="Shown on the left.">
        Left
      </button>
      <button type="button" class="native" tooltipPosition="top" wjTooltip="Shown above.">
        Top
      </button>
      <button type="button" class="native" tooltipPosition="bottom" wjTooltip="Shown below.">
        Bottom
      </button>
      <button type="button" class="native" tooltipPosition="right" wjTooltip="Shown on the right.">
        Right
      </button>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding-block: 48px;
    }

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
export class TooltipPositionsExample {}
