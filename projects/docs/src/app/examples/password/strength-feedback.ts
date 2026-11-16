import { Component } from '@angular/core';
import { WjPassword } from 'weeljack-ng/password';

@Component({
  selector: 'docs-password-strength-feedback-example',
  imports: [WjPassword],
  template: `
    <label for="strength-password">New password</label>
    <wj-password inputId="strength-password" autocomplete="new-password" toggleMask />
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class PasswordStrengthFeedbackExample {}
