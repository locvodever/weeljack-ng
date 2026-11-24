import { Component, signal } from '@angular/core';
import { WjCheckbox } from 'weeljack-ng/checkbox';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-checkbox-in-a-field-example',
  imports: [WjField, WjCheckbox],
  template: `
    <wj-field label="Remember this device" hint="Skip the sign-in code for 30 days.">
      <wj-checkbox [(checked)]="remember" />
    </wj-field>
    <wj-field label="Accept the terms" error="Accept the terms to continue.">
      <wj-checkbox />
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
export class CheckboxInAFieldExample {
  protected readonly remember = signal(true);
}
