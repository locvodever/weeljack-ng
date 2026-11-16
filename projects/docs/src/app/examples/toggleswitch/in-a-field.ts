import { Component, signal } from '@angular/core';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-toggleswitch-in-a-field-example',
  imports: [WjField, WjToggleSwitch],
  template: `
    <wj-field label="Show prices with tax" hint="You can change this at checkout.">
      <wj-toggleswitch [(checked)]="withTax" />
    </wj-field>
    <wj-field label="Share my profile" error="Turn this on to continue.">
      <wj-toggleswitch />
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
export class ToggleSwitchInAFieldExample {
  protected readonly withTax = signal(true);
}
