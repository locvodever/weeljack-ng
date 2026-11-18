import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iconfield-in-a-field-example',
  imports: [WjField, WjIconField, WjInputIcon, WjInputText],
  template: `
    <wj-field label="Search" hint="Search by name or email.">
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
        <input wjInputText type="search" autocomplete="off" />
      </wj-iconfield>
    </wj-field>
    <wj-field label="Email" error="Enter an email address.">
      <wj-iconfield>
        <input wjInputText type="email" autocomplete="email" />
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
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class IconFieldInAFieldExample {}
