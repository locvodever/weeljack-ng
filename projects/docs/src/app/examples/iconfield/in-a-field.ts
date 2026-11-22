import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjIcon, wjIconMail, wjIconSearch } from 'weeljack-ng/icon';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iconfield-in-a-field-example',
  imports: [WjField, WjIconField, WjInputIcon, WjInputText, WjIcon],
  template: `
    <wj-field label="Search" hint="Search by name or email.">
      <wj-iconfield>
        <wj-inputicon>
          <wj-icon [icon]="search" />
        </wj-inputicon>
        <input wjInputText type="search" autocomplete="off" />
      </wj-iconfield>
    </wj-field>
    <wj-field label="Email" error="Enter an email address.">
      <wj-iconfield>
        <input wjInputText type="email" autocomplete="email" />
        <wj-inputicon>
          <wj-icon [icon]="mail" />
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
export class IconFieldInAFieldExample {
  protected readonly search = wjIconSearch;
  protected readonly mail = wjIconMail;
}
