import { Component } from '@angular/core';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputicon-leading-example',
  imports: [WjIconField, WjInputIcon, WjInputText],
  template: `
    <div class="item">
      <label for="inputicon-leading-search">Search</label>
      <wj-iconfield>
        <wj-inputicon>
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5 14 14" />
          </svg>
        </wj-inputicon>
        <input wjInputText id="inputicon-leading-search" type="search" autocomplete="off" />
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
export class InputIconLeadingExample {}
