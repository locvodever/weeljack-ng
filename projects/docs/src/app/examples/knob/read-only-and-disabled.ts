import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjKnob } from 'weeljack-ng/knob';

@Component({
  selector: 'docs-knob-read-only-and-disabled-example',
  imports: [WjField, WjKnob],
  template: `
    <wj-field label="Battery level">
      <wj-knob readonly valueTemplate="{value}%" [value]="72" />
    </wj-field>
    <wj-field label="Volume">
      <wj-knob disabled [value]="30" />
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
export class KnobReadOnlyAndDisabledExample {}
