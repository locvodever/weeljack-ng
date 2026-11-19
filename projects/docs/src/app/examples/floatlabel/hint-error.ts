import { Component } from '@angular/core';
import { WjFloatLabel } from 'weeljack-ng/floatlabel';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-floatlabel-hint-error-example',
  imports: [WjFloatLabel, WjInputText],
  template: `
    <div>
      <wj-floatlabel>
        <input
          wjInputText
          id="floatlabel-hint-email"
          type="email"
          autocomplete="email"
          aria-describedby="floatlabel-hint-email-hint"
        />
        <label for="floatlabel-hint-email">Email</label>
      </wj-floatlabel>
      <p class="hint" id="floatlabel-hint-email-hint">We only use it to send your receipt.</p>
    </div>
    <div>
      <wj-floatlabel>
        <input
          wjInputText
          invalid
          id="floatlabel-hint-phone"
          type="tel"
          autocomplete="tel"
          aria-describedby="floatlabel-hint-phone-error"
        />
        <label for="floatlabel-hint-phone">Phone number</label>
      </wj-floatlabel>
      <p class="error" id="floatlabel-hint-phone-error">Enter a phone number with its area code.</p>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 24px;
      padding-block-start: 24px;
      inline-size: min(100%, 24rem);
    }

    p {
      margin: 4px 0 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .hint {
      color: var(--wj-text-muted-color);
    }

    .error {
      color: var(--wj-error-color);
    }
  `,
})
export class FloatLabelHintErrorExample {}
