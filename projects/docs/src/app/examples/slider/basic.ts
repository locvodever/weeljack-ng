import { Component, signal } from '@angular/core';
import { WjSlider } from 'weeljack-ng/slider';

@Component({
  selector: 'docs-slider-basic-example',
  imports: [WjSlider],
  template: `
    <span id="basic-volume">Volume</span>
    <wj-slider ariaLabelledBy="basic-volume" [(value)]="volume" />
    <p class="state">Value: {{ volume() }}</p>
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
export class SliderBasicExample {
  protected readonly volume = signal<number | null>(40);
}
