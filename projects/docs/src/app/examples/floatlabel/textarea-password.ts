import { Component } from '@angular/core';
import { WjFloatLabel } from 'weeljack-ng/floatlabel';
import { WjPassword } from 'weeljack-ng/password';
import { WjTextarea } from 'weeljack-ng/textarea';

@Component({
  selector: 'docs-floatlabel-textarea-password-example',
  imports: [WjFloatLabel, WjPassword, WjTextarea],
  template: `
    <wj-floatlabel>
      <textarea wjTextarea id="floatlabel-textarea-message" rows="3"></textarea>
      <label for="floatlabel-textarea-message">Message</label>
    </wj-floatlabel>
    <wj-floatlabel>
      <wj-password
        inputId="floatlabel-textarea-password"
        autocomplete="current-password"
        [feedback]="false"
      />
      <label for="floatlabel-textarea-password">Password</label>
    </wj-floatlabel>
  `,
  styles: `
    :host {
      display: grid;
      gap: 24px;
      padding-block-start: 24px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class FloatLabelTextareaPasswordExample {}
