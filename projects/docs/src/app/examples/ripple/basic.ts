import { Component } from '@angular/core';
import { WjRipple } from 'weeljack-ng/ripple';

@Component({
  selector: 'docs-ripple-basic-example',
  imports: [WjRipple],
  template: `
    <button type="button" class="tile" wjRipple>Photos</button>
    <button type="button" class="tile" wjRipple>Music</button>
    <button type="button" class="tile" wjRipple>Files</button>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
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
export class RippleBasicExample {}
