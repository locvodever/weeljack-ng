import { Component } from '@angular/core';
import { WjPassword } from 'weeljack-ng/password';

@Component({
  selector: 'docs-password-mask-toggle-example',
  imports: [WjPassword],
  template: `
    <label for="mask-password">Password</label>
    <wj-password
      inputId="mask-password"
      autocomplete="current-password"
      toggleMask
      [feedback]="false"
    />
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
export class PasswordMaskToggleExample {}
