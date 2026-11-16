import { Component, computed, signal } from '@angular/core';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-field-inline-toggleswitch-example',
  imports: [WjField, WjToggleSwitch],
  template: `
    <wj-field label="Send me product updates" hint="About one email a month." [error]="error()">
      <wj-toggleswitch [(checked)]="subscribed" (focusout)="touched.set(true)" />
    </wj-field>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class FieldInlineToggleSwitchExample {
  protected readonly subscribed = signal(false);
  protected readonly touched = signal(false);

  /** Empty until the switch is touched, so the page loads clean. */
  protected readonly error = computed(() =>
    this.touched() && !this.subscribed() ? 'Turn this on to get product updates.' : '',
  );
}
