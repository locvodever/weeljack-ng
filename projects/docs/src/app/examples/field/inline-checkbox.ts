import { Component, computed, signal } from '@angular/core';
import { WjCheckbox } from 'weeljack-ng/checkbox';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-field-inline-checkbox-example',
  imports: [WjField, WjCheckbox],
  template: `
    <wj-field
      label="I accept the terms of service"
      hint="You can read them before you continue."
      [error]="error()"
    >
      <wj-checkbox [(checked)]="accepted" (focusout)="touched.set(true)" />
    </wj-field>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class FieldInlineCheckboxExample {
  protected readonly accepted = signal(false);
  protected readonly touched = signal(false);

  /** Empty until the checkbox is touched, so the page loads clean. */
  protected readonly error = computed(() =>
    this.touched() && !this.accepted() ? 'Accept the terms to continue.' : '',
  );
}
