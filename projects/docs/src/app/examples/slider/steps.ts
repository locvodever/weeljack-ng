import { Component, signal } from '@angular/core';
import { WjSlider } from 'weeljack-ng/slider';

@Component({
  selector: 'docs-slider-steps-example',
  imports: [WjSlider],
  template: `
    <span id="steps-opacity">Opacity</span>
    <wj-slider ariaLabelledBy="steps-opacity" step="5" [(value)]="opacity" />
    <p class="state">Value: {{ opacity() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class SliderStepsExample {
  protected readonly opacity = signal<number | null>(50);
}
