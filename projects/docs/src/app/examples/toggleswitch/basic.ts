import { Component, signal } from '@angular/core';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';

@Component({
  selector: 'docs-toggleswitch-basic-example',
  imports: [WjToggleSwitch],
  template: `
    <wj-toggleswitch inputId="basic-notifications" [(checked)]="enabled" />
    <label for="basic-notifications">Email me about new replies</label>
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    label {
      line-height: 24px;
    }
  `,
})
export class ToggleSwitchBasicExample {
  protected readonly enabled = signal(false);
}
