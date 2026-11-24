import { Component, signal } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjTextarea } from 'weeljack-ng/textarea';

@Component({
  selector: 'docs-textarea-in-a-field-example',
  imports: [WjField, WjTextarea],
  template: `
    <wj-field label="Message" hint="Tell us what you need help with.">
      <textarea
        wjTextarea
        rows="3"
        maxlength="200"
        aria-describedby="message-count"
        (input)="count.set(length($event))"
      ></textarea>
      <p id="message-count" class="count">{{ count() }} of 200 characters</p>
    </wj-field>
    <wj-field label="Reason" error="Enter a reason for the change.">
      <textarea wjTextarea rows="3"></textarea>
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .count {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      text-align: end;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TextareaInAFieldExample {
  protected readonly count = signal(0);

  protected length(event: Event): number {
    return event.target instanceof HTMLTextAreaElement ? event.target.value.length : 0;
  }
}
