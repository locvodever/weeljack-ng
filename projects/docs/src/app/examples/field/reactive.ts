import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-field-reactive-example',
  imports: [ReactiveFormsModule, WjField, WjInputText],
  template: `
    <wj-field label="Email" hint="We only use it to send your receipt." [error]="error()">
      <input
        wjInputText
        type="email"
        autocomplete="email"
        placeholder="name@example.com"
        [formControl]="email"
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
export class FieldReactiveExample {
  protected readonly email = new FormControl('', { nonNullable: true });

  /** Empty until the control is touched, so the page loads clean. */
  protected error(): string {
    return this.email.touched && !this.email.value.includes('@') ? 'Enter an email address.' : '';
  }
}
