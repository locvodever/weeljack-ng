import { Component } from '@angular/core';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iconfield-trailing-example',
  imports: [WjIconField, WjInputIcon, WjInputText],
  template: `
    <div class="item">
      <label for="iconfield-trailing-email">Email</label>
      <wj-iconfield>
        <input wjInputText id="iconfield-trailing-email" type="email" autocomplete="email" />
        <wj-inputicon>
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
            <path d="m2 4 6 4.5L14 4" />
          </svg>
        </wj-inputicon>
      </wj-iconfield>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .item {
      display: grid;
      gap: 4px;
    }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }
  `,
})
export class IconFieldTrailingExample {}
