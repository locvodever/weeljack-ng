import { Component, signal } from '@angular/core';
import { WjToggleButton } from 'weeljack-ng/togglebutton';

@Component({
  selector: 'docs-togglebutton-your-own-labels-example',
  imports: [WjToggleButton],
  template: `
    <span id="labels-visibility">Profile visibility</span>
    <wj-togglebutton
      ariaLabelledBy="labels-visibility"
      onLabel="Public"
      offLabel="Private"
      [(checked)]="visible"
    />
    <p class="state">Checked: {{ visible() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    wj-togglebutton {
      inline-size: 8rem;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ToggleButtonYourOwnLabelsExample {
  protected readonly visible = signal(true);
}
