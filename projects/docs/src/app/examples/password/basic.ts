import { Component, signal } from '@angular/core';
import { WjPassword } from 'weeljack-ng/password';

@Component({
  selector: 'docs-password-basic-example',
  imports: [WjPassword],
  template: `
    <label for="basic-current">Current password</label>
    <wj-password
      inputId="basic-current"
      autocomplete="current-password"
      [feedback]="false"
      [(value)]="current"
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
export class PasswordBasicExample {
  protected readonly current = signal<string | null>(null);
}
