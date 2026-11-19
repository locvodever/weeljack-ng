import { Component } from '@angular/core';
import { WjColorPicker } from 'weeljack-ng/colorpicker';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-colorpicker-in-a-field-example',
  imports: [WjField, WjColorPicker],
  template: `
    <wj-field label="Accent color" hint="Used for links and buttons.">
      <wj-colorpicker value="#0f766e" />
    </wj-field>
    <wj-field label="Highlight color" error="Pick a darker highlight color.">
      <wj-colorpicker value="#facc15" />
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
export class ColorpickerInAFieldExample {}
