import { Component } from '@angular/core';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';

@Component({
  selector: 'docs-styling-host-class-and-pt-example',
  imports: [WjButton],
  template: `<wj-button class="framed" label="Save" [pt]="pt" />`,
  styles: `
    .framed {
      padding: 4px;
      border: 2px dashed var(--wj-primary-color);
      border-radius: 12px;
    }
  `,
})
export class StylingHostClassAndPtExample {
  /** The button's `label` part, which tracks the installed Optimus minor. */
  protected readonly pt: WjButtonPt = {
    label: { style: 'letter-spacing: 0.1em; text-transform: uppercase' },
  };
}
