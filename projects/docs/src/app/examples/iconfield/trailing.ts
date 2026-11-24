import { Component } from '@angular/core';
import { WjIcon, wjIconMail } from 'weeljack-ng/icon';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iconfield-trailing-example',
  imports: [WjIconField, WjInputIcon, WjInputText, WjIcon],
  template: `
    <div class="item">
      <label for="iconfield-trailing-email">Email</label>
      <wj-iconfield>
        <input wjInputText id="iconfield-trailing-email" type="email" autocomplete="email" />
        <wj-inputicon>
          <wj-icon [icon]="mail" />
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
export class IconFieldTrailingExample {
  protected readonly mail = wjIconMail;
}
