import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjOverlayBadge, type WjOverlayBadgeSeverity } from 'weeljack-ng/overlaybadge';

interface Entry {
  label: string;
  value: number;
  ariaLabel: string;
  severity?: WjOverlayBadgeSeverity;
}

@Component({
  selector: 'docs-overlaybadge-severities-example',
  imports: [WjOverlayBadge, WjButton],
  template: `
    <div class="row">
      @for (entry of entries; track entry.label) {
        <wj-overlaybadge [value]="entry.value" [severity]="entry.severity">
          <wj-button
            [label]="entry.label"
            [ariaLabel]="entry.ariaLabel"
            variant="outlined"
            severity="secondary"
          />
        </wj-overlaybadge>
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 24px;
    }
  `,
})
export class OverlayBadgeSeveritiesExample {
  protected readonly entries: readonly Entry[] = [
    { label: 'Inbox', value: 3, ariaLabel: 'Inbox, 3 unread' },
    { label: 'Passed', value: 12, ariaLabel: 'Passed, 12 checks', severity: 'success' },
    { label: 'Updates', value: 2, ariaLabel: 'Updates, 2 new', severity: 'info' },
    { label: 'Warnings', value: 5, ariaLabel: 'Warnings, 5', severity: 'warn' },
    { label: 'Errors', value: 1, ariaLabel: 'Errors, 1', severity: 'danger' },
    { label: 'Drafts', value: 4, ariaLabel: 'Drafts, 4', severity: 'secondary' },
    { label: 'Mentions', value: 7, ariaLabel: 'Mentions, 7 new', severity: 'contrast' },
  ];
}
