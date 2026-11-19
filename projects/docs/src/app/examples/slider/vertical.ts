import { Component, signal } from '@angular/core';
import { WjSlider } from 'weeljack-ng/slider';

@Component({
  selector: 'docs-slider-vertical-example',
  imports: [WjSlider],
  template: `
    <span id="vertical-volume">Volume</span>
    <wj-slider ariaLabelledBy="vertical-volume" orientation="vertical" [(value)]="volume" />
    <p class="state">Value: {{ volume() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    wj-slider {
      block-size: 12rem;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class SliderVerticalExample {
  protected readonly volume = signal<number | null>(40);
}
