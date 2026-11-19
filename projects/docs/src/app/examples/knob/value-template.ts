import { Component, signal } from '@angular/core';
import { WjKnob } from 'weeljack-ng/knob';

@Component({
  selector: 'docs-knob-value-template-example',
  imports: [WjKnob],
  template: `
    <span id="template-discount">Discount</span>
    <wj-knob ariaLabelledBy="template-discount" valueTemplate="{value}%" [(value)]="discount" />
    <p class="state">Value: {{ discount() }}</p>
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
export class KnobValueTemplateExample {
  protected readonly discount = signal<number | null>(25);
}
