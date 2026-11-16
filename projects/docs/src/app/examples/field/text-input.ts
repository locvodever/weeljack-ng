import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-field-text-input-example',
  imports: [FormsModule, WjField, WjInputText],
  template: `
    <wj-field label="Email" hint="We only use it to send your receipt." [error]="error()">
      <input
        wjInputText
        type="email"
        autocomplete="email"
        placeholder="name@example.com"
        [(ngModel)]="email"
        (blur)="touched.set(true)"
      />
    </wj-field>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class FieldTextInputExample {
  protected readonly email = signal('');
  protected readonly touched = signal(false);

  /** Empty until the input is touched, so the page loads clean. */
  protected readonly error = computed(() =>
    this.touched() && !this.email().includes('@') ? 'Enter an email address.' : '',
  );
}
