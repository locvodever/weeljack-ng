import { Component } from '@angular/core';
import { WjTag, type WjTagSeverity } from 'weeljack-ng/tag';

@Component({
  selector: 'docs-tag-severities-example',
  imports: [WjTag],
  template: `
    <div class="row">
      <wj-tag value="Default" />
      @for (severity of severities; track severity) {
        <wj-tag [value]="severity" [severity]="severity" />
      }
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class TagSeveritiesExample {
  protected readonly severities: readonly WjTagSeverity[] = [
    'success',
    'info',
    'warn',
    'danger',
    'secondary',
    'contrast',
  ];
}
