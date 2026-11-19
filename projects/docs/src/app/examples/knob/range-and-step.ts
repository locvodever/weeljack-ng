import { Component, signal } from '@angular/core';
import { WjKnob } from 'weeljack-ng/knob';

@Component({
  selector: 'docs-knob-range-and-step-example',
  imports: [WjKnob],
  template: `
    <span id="range-temperature">Room temperature</span>
    <wj-knob
      ariaLabelledBy="range-temperature"
      [min]="16"
      [max]="30"
      step="2"
      [(value)]="temperature"
    />
    <p class="state">Value: {{ temperature() }}</p>
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
export class KnobRangeAndStepExample {
  protected readonly temperature = signal<number | null>(20);
}
