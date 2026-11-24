import { Component } from '@angular/core';
import { WjProgressBar } from 'weeljack-ng/progressbar';

@Component({
  selector: 'docs-progressbar-determinate-example',
  imports: [WjProgressBar],
  template: `
    <span id="upload-caption" class="caption">Uploading report.pdf</span>
    <wj-progressbar [value]="40" ariaLabelledBy="upload-caption" />
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
export class ProgressbarDeterminateExample {}
