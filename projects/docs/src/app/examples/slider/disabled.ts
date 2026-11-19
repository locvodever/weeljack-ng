import { Component } from '@angular/core';
import { WjSlider } from 'weeljack-ng/slider';

@Component({
  selector: 'docs-slider-disabled-example',
  imports: [WjSlider],
  template: `
    <span id="disabled-volume">Volume</span>
    <wj-slider ariaLabelledBy="disabled-volume" disabled [value]="40" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class SliderDisabledExample {}
