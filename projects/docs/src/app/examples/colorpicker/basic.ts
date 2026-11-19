import { Component, signal } from '@angular/core';
import { WjColorPicker } from 'weeljack-ng/colorpicker';

@Component({
  selector: 'docs-colorpicker-basic-example',
  imports: [WjColorPicker],
  template: `
    <span id="basic-accent">Accent color</span>
    <wj-colorpicker ariaLabelledBy="basic-accent" [(value)]="accent" />
    <p class="state">Value: {{ accent() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      justify-items: start;
      inline-size: min(100%, 24rem);
      min-block-size: 15rem;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ColorpickerBasicExample {
  protected readonly accent = signal<string | null>('#0f766e');
}
