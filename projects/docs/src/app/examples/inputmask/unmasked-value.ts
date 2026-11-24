import { Component, signal } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputMask } from 'weeljack-ng/inputmask';

@Component({
  selector: 'docs-inputmask-unmasked-value-example',
  imports: [WjField, WjInputMask],
  template: `
    <wj-field label="Product code" hint="Three letters, then four digits.">
      <input
        wjInputMask="aaa-9999"
        placeholder="ABC-1234"
        (unmaskedChange)="unmasked.set($event)"
      />
    </wj-field>
    <p class="state">Unmasked: {{ unmasked() || 'nothing yet' }}</p>
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
export class InputMaskUnmaskedValueExample {
  protected readonly unmasked = signal('');
}
