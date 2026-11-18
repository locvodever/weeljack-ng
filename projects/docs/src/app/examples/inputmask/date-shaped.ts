import { Component, signal } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputMask } from 'weeljack-ng/inputmask';

@Component({
  selector: 'docs-inputmask-date-shaped-example',
  imports: [WjField, WjInputMask],
  template: `
    <wj-field label="Date of birth">
      <input
        wjInputMask="99/99/9999"
        placeholder="mm/dd/yyyy"
        inputmode="numeric"
        autocomplete="bday"
        (completed)="complete.set(true)"
        (unmaskedChange)="complete.set($event.length === 8)"
      />
    </wj-field>
    <p class="state">Complete: {{ complete() ? 'yes' : 'no' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class InputMaskDateShapedExample {
  protected readonly complete = signal(false);
}
