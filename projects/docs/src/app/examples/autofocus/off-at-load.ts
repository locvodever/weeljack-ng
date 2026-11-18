import { Component } from '@angular/core';
import { WjAutoFocus } from 'weeljack-ng/autofocus';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-autofocus-off-at-load-example',
  imports: [WjAutoFocus, WjField, WjInputText],
  template: `
    <wj-field label="Search" hint="Nothing takes focus here: the attribute is off.">
      <input wjInputText wjAutoFocus="false" type="search" autocomplete="off" />
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
export class AutoFocusOffAtLoadExample {}
