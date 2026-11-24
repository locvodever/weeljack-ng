import { Component, computed, signal } from '@angular/core';
import { WjAutoFocus } from 'weeljack-ng/autofocus';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-autofocus-on-a-wj-host-example',
  imports: [WjAutoFocus, WjButton, WjField, WjInputNumber],
  template: `
    <div class="row">
      <wj-button
        label="Change quantity"
        severity="secondary"
        variant="outlined"
        [pt]="triggerPt()"
        (click)="open.set(!open())"
      />
    </div>
    @if (open()) {
      <wj-field label="Quantity">
        <wj-inputnumber wjAutoFocus [(value)]="quantity" />
      </wj-field>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class AutoFocusOnAWjHostExample {
  protected readonly open = signal(false);
  protected readonly quantity = signal<number | null>(1);

  /** `wj-button` has no ARIA input for a disclosure trigger: set it on its button through `pt`. */
  protected readonly triggerPt = computed<WjButtonPt>(() => ({
    root: { 'aria-expanded': String(this.open()) },
  }));
}
