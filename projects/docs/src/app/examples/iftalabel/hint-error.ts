import { Component } from '@angular/core';
import { WjIftaLabel } from 'weeljack-ng/iftalabel';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iftalabel-hint-error-example',
  imports: [WjIftaLabel, WjInputText],
  template: `
    <div>
      <wj-iftalabel>
        <input
          wjInputText
          id="iftalabel-hint-email"
          type="email"
          autocomplete="email"
          aria-describedby="iftalabel-hint-email-hint"
        />
        <label for="iftalabel-hint-email">Email</label>
      </wj-iftalabel>
      <p class="hint" id="iftalabel-hint-email-hint">We only use it to send your receipt.</p>
    </div>
    <div>
      <wj-iftalabel>
        <input
          wjInputText
          invalid
          id="iftalabel-hint-phone"
          type="tel"
          autocomplete="tel"
          aria-describedby="iftalabel-hint-phone-error"
        />
        <label for="iftalabel-hint-phone">Phone number</label>
      </wj-iftalabel>
      <p class="error" id="iftalabel-hint-phone-error">Enter a phone number with its area code.</p>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
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
export class IftaLabelHintErrorExample {}
