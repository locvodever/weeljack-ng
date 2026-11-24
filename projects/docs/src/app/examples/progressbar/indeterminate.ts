import { Component } from '@angular/core';
import { WjProgressBar } from 'weeljack-ng/progressbar';

@Component({
  selector: 'docs-progressbar-indeterminate-example',
  imports: [WjProgressBar],
  template: `
    <span id="export-caption" class="caption">Preparing your export</span>
    <wj-progressbar mode="indeterminate" ariaLabelledBy="export-caption" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      max-inline-size: 40rem;
    }

    .caption {
      color: var(--wj-text-color);
      font-size: 0.875rem;
      font-weight: 600;
    }
  `,
})
export class ProgressbarIndeterminateExample {}
