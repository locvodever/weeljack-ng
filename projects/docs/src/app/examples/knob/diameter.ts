import { Component } from '@angular/core';
import { WjKnob } from 'weeljack-ng/knob';

@Component({
  selector: 'docs-knob-diameter-example',
  imports: [WjKnob],
  template: `
    <div class="item">
      <wj-knob ariaLabelledBy="diameter-small" [diameter]="64" [value]="50" />
      <span id="diameter-small">Small</span>
    </div>
    <div class="item">
      <wj-knob ariaLabelledBy="diameter-default" [value]="50" />
      <span id="diameter-default">Default</span>
    </div>
    <div class="item">
      <wj-knob ariaLabelledBy="diameter-large" [diameter]="160" [value]="50" />
      <span id="diameter-large">Large</span>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 16px;
    }

    .item {
      display: grid;
      justify-items: center;
      gap: 8px;
    }
  `,
})
export class KnobDiameterExample {}
