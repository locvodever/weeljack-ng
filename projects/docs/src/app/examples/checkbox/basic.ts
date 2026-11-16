import { Component, signal } from '@angular/core';
import { WjCheckbox } from 'weeljack-ng/checkbox';

@Component({
  selector: 'docs-checkbox-basic-example',
  imports: [WjCheckbox],
  template: `
    <wj-checkbox inputId="basic-newsletter" [(checked)]="subscribed" />
    <label for="basic-newsletter">Send me the monthly newsletter</label>
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
export class CheckboxBasicExample {
  protected readonly subscribed = signal(false);
}
