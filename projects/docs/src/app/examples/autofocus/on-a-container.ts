import { Component, computed, signal } from '@angular/core';
import { WjAutoFocus } from 'weeljack-ng/autofocus';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-autofocus-on-a-container-example',
  imports: [WjAutoFocus, WjButton, WjField, WjInputText],
  template: `
    <div class="row">
      <wj-button
        label="Add an address"
        severity="secondary"
        variant="outlined"
        [pt]="triggerPt()"
        (click)="open.set(!open())"
      />
    </div>
    @if (open()) {
      <div wjAutoFocus class="address">
        <wj-field label="Street">
          <input wjInputText autocomplete="street-address" />
        </wj-field>
        <wj-field label="City">
          <input wjInputText autocomplete="address-level2" />
        </wj-field>
      </div>
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

    .address {
      display: grid;
      gap: 16px;
    }
  `,
})
export class AutoFocusOnAContainerExample {
  protected readonly open = signal(false);

  /** `wj-button` has no ARIA input for a disclosure trigger: set it on its button through `pt`. */
  protected readonly triggerPt = computed<WjButtonPt>(() => ({
    root: { 'aria-expanded': String(this.open()) },
  }));
}
