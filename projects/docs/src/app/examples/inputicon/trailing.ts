import { Component } from '@angular/core';
import { WjIcon, wjIconCheck } from 'weeljack-ng/icon';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputicon-trailing-example',
  imports: [WjIconField, WjInputIcon, WjInputText, WjIcon],
  template: `
    <div class="item">
      <label for="inputicon-trailing-username">Username</label>
      <wj-iconfield>
        <input
          wjInputText
          id="inputicon-trailing-username"
          value="river.stone"
          autocomplete="username"
          aria-describedby="inputicon-trailing-hint"
        />
        <wj-inputicon>
          <wj-icon [icon]="check" />
        </wj-inputicon>
      </wj-iconfield>
      <p id="inputicon-trailing-hint">That username is available.</p>
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

    p {
      margin: 0;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `,
})
export class InputIconTrailingExample {
  protected readonly check = wjIconCheck;
}
