import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjPassword } from 'weeljack-ng/password';

@Component({
  selector: 'docs-password-in-a-field-example',
  imports: [WjField, WjPassword],
  template: `
    <wj-field label="New password" hint="Use at least 12 characters.">
      <wj-password autocomplete="new-password" toggleMask [feedback]="false" />
    </wj-field>
    <wj-field label="Confirm password" error="Enter the same password again.">
      <wj-password autocomplete="new-password" toggleMask [feedback]="false" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class PasswordInAFieldExample {}
