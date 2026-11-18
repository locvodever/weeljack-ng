import { Component } from '@angular/core';
import { WjProgressBar } from 'weeljack-ng/progressbar';

@Component({
  selector: 'docs-progressbar-without-value-example',
  imports: [WjProgressBar],
  template: `
    <span id="photos-caption" class="caption">Uploading photos</span>
    <wj-progressbar
      [value]="60"
      [showValue]="false"
      ariaLabelledBy="photos-caption"
      ariaDescribedBy="photos-count"
    />
    <span id="photos-count" class="count">3 of 5 photos uploaded</span>
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

    .count {
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class ProgressbarWithoutValueExample {}
