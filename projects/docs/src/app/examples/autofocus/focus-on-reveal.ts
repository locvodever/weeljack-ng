import { Component, computed, signal } from '@angular/core';
import { WjAutoFocus } from 'weeljack-ng/autofocus';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-autofocus-focus-on-reveal-example',
  imports: [WjAutoFocus, WjButton, WjField, WjInputText],
  template: `
    <div class="row">
      <wj-button
        label="Add a note"
        severity="secondary"
        variant="outlined"
        [pt]="triggerPt()"
        (click)="open.set(!open())"
      />
    </div>
    @if (open()) {
      <wj-field label="Note">
        <input wjInputText wjAutoFocus autocomplete="off" />
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
export class AutoFocusFocusOnRevealExample {
  protected readonly open = signal(false);

  /** `wj-button` has no ARIA input for a disclosure trigger: set it on its button through `pt`. */
  protected readonly triggerPt = computed<WjButtonPt>(() => ({
    root: { 'aria-expanded': String(this.open()) },
  }));
}
