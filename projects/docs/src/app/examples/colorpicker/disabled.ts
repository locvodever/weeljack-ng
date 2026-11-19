import { Component } from '@angular/core';
import { WjColorPicker } from 'weeljack-ng/colorpicker';

@Component({
  selector: 'docs-colorpicker-disabled-example',
  imports: [WjColorPicker],
  template: `
    <span id="disabled-accent">Accent color</span>
    <wj-colorpicker ariaLabelledBy="disabled-accent" disabled value="#0f766e" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      justify-items: start;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class ColorpickerDisabledExample {}
