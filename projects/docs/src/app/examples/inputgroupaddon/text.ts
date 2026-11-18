import { Component } from '@angular/core';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputGroupAddon } from 'weeljack-ng/inputgroupaddon';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inputgroupaddon-text-example',
  imports: [WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <div class="item">
      <label for="inputgroupaddon-username">Username</label>
      <wj-inputgroup>
        <wj-inputgroupaddon id="inputgroupaddon-username-at">@</wj-inputgroupaddon>
        <input
          wjInputText
          id="inputgroupaddon-username"
          autocomplete="username"
          aria-describedby="inputgroupaddon-username-at"
        />
      </wj-inputgroup>
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
export class InputGroupAddonTextExample {}
