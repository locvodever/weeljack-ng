import { Component, signal } from '@angular/core';
import { WjKnob } from 'weeljack-ng/knob';

@Component({
  selector: 'docs-knob-basic-example',
  imports: [WjKnob],
  template: `
    <span id="basic-volume">Volume</span>
    <wj-knob ariaLabelledBy="basic-volume" [(value)]="volume" />
    <p class="state">Value: {{ volume() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      justify-items: start;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class KnobBasicExample {
  protected readonly volume = signal<number | null>(50);
}
