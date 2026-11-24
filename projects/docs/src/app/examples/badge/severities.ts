import { Component } from '@angular/core';
import { WjBadge, type WjBadgeSeverity } from 'weeljack-ng/badge';

@Component({
  selector: 'docs-badge-severities-example',
  imports: [WjBadge],
  template: `
    <div class="row">
      <wj-badge value="Default" />
      @for (severity of severities; track severity) {
        <wj-badge [value]="severity" [severity]="severity" />
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `,
})
export class BadgeSeveritiesExample {
  protected readonly severities: readonly WjBadgeSeverity[] = [
    'success',
    'info',
    'warn',
    'danger',
    'secondary',
    'contrast',
  ];
}
