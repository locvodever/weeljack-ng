import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjKnob } from 'weeljack-ng/knob';

@Component({
  selector: 'docs-knob-in-a-field-example',
  imports: [WjField, WjKnob],
  template: `
    <wj-field label="Volume" hint="Applies to all speakers.">
      <wj-knob [value]="50" />
    </wj-field>
    <wj-field label="Bass" error="Set the bass between 20 and 80.">
      <wj-knob [value]="90" />
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
export class KnobInAFieldExample {}
