import { Component } from '@angular/core';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-iconfield-basic-example',
  imports: [WjIconField, WjInputText],
  template: `
    <div class="item">
      <label for="iconfield-basic-search">Search</label>
      <wj-iconfield>
        <input wjInputText id="iconfield-basic-search" type="search" autocomplete="off" />
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
export class IconFieldBasicExample {}
