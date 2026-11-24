import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjSlider } from 'weeljack-ng/slider';

@Component({
  selector: 'docs-slider-in-a-field-example',
  imports: [WjField, WjSlider],
  template: `
    <wj-field label="Text size" hint="Applies to the reader only.">
      <wj-slider [min]="12" [max]="32" [value]="16" />
    </wj-field>
    <wj-field label="Maximum price" error="Set a maximum price.">
      <wj-slider [min]="0" [max]="500" [value]="0" />
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
export class SliderInAFieldExample {}
