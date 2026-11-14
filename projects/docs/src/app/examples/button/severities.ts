import { Component } from '@angular/core';
import { WjButton, type WjButtonSeverity } from 'weeljack-ng/button';

@Component({
  selector: 'docs-button-severities-example',
  imports: [WjButton],
  template: `
    @for (severity of severities; track severity) {
      <wj-button [label]="severity" [severity]="severity" />
    }
  `,
})
export class ButtonSeveritiesExample {
  protected readonly severities: readonly WjButtonSeverity[] = [
    'primary',
    'secondary',
    'success',
    'info',
    'warn',
    'danger',
    'help',
    'contrast',
  ];
}
