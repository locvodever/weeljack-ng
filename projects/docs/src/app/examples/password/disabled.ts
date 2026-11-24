import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjPassword } from 'weeljack-ng/password';

@Component({
  selector: 'docs-password-disabled-example',
  imports: [WjField, WjPassword],
  template: `
    <wj-field label="Password" hint="Managed by your identity provider.">
      <wj-password toggleMask disabled [feedback]="false" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class PasswordDisabledExample {}
