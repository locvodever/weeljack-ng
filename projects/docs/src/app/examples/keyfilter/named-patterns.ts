import { Component } from '@angular/core';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjKeyFilter } from 'weeljack-ng/keyfilter';

@Component({
  selector: 'docs-keyfilter-named-patterns-example',
  imports: [WjInputText, WjKeyFilter],
  template: `
    <div class="row">
      <label for="patterns-quantity">Quantity (digits only)</label>
      <input wjInputText wjKeyFilter="pint" id="patterns-quantity" inputmode="numeric" />
    </div>
    <div class="row">
      <label for="patterns-amount">Amount (digits and a decimal point)</label>
      <input wjInputText wjKeyFilter="money" id="patterns-amount" inputmode="decimal" />
    </div>
    <div class="row">
      <label for="patterns-initials">Initials (letters only)</label>
      <input wjInputText wjKeyFilter="alpha" id="patterns-initials" autocomplete="off" />
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class KeyFilterNamedPatternsExample {}
