import { Component } from '@angular/core';
import { WjIcon, wjIconSearch } from 'weeljack-ng/icon';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iconfield-leading-example',
  imports: [WjIconField, WjInputIcon, WjInputText, WjIcon],
  template: `
    <div class="item">
      <label for="iconfield-leading-search">Search</label>
      <wj-iconfield>
        <wj-inputicon>
          <wj-icon [icon]="search" />
        </wj-inputicon>
        <input wjInputText id="iconfield-leading-search" type="search" autocomplete="off" />
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
export class IconFieldLeadingExample {
  protected readonly search = wjIconSearch;
}
