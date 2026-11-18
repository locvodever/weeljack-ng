import { Component, signal } from '@angular/core';
import { WjRipple } from 'weeljack-ng/ripple';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';

@Component({
  selector: 'docs-ripple-disabled-example',
  imports: [WjRipple, WjToggleSwitch],
  template: `
    <div class="row">
      <wj-toggleswitch inputId="ripple-show-ink" [(checked)]="showInk" />
      <label for="ripple-show-ink">Show ink on press</label>
    </div>
    <button type="button" class="tile" wjRipple [wjRippleDisabled]="!showInk()">Photos</button>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      justify-items: start;
    }

    .row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    label {
      line-height: 24px;
    }

    .tile {
      inline-size: 10rem;
      block-size: 6rem;
      border: 1px solid var(--wj-form-field-border-color);
      border-radius: 12px;
      background: var(--wj-content-background);
      color: var(--wj-text-color);
      font: inherit;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
    }

    .tile:hover {
      background: var(--wj-content-hover-background);
    }

    .tile:focus-visible {
      outline: var(--wj-focus-ring-width, 2px) var(--wj-focus-ring-style, solid)
        var(--wj-focus-ring-color);
      outline-offset: var(--wj-focus-ring-offset, 2px);
    }
  `,
})
export class RippleDisabledExample {
  protected readonly showInk = signal(true);
}
