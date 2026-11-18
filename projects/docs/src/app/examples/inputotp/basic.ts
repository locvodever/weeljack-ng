import { Component, signal } from '@angular/core';
import { WjInputOtp } from 'weeljack-ng/inputotp';

@Component({
  selector: 'docs-inputotp-basic-example',
  imports: [WjInputOtp],
  template: `
    <span id="basic-code-label">Verification code</span>
    <wj-inputotp ariaLabelledBy="basic-code-label" [length]="4" [(value)]="code" />
    <p class="state">Code: {{ code() ?? 'none yet' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: 8px;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class InputOtpBasicExample {
  protected readonly code = signal<string | null>(null);
}
