import { Component } from '@angular/core';
import { WjIcon, wjIconDef } from 'weeljack-ng/icon';

/** A stroke icon: it takes the svg's stroke, like the set's own. */
const target = wjIconDef('target', '0 0 24 24', [
  ['circle', { cx: 12, cy: 12, r: 9 }],
  ['circle', { cx: 12, cy: 12, r: 3 }],
  ['line', { x1: 12, y1: 1, x2: 12, y2: 5 }],
]);

/** A filled icon: each node paints itself with `fill` and `stroke: 'none'`. */
const badge = wjIconDef('badge', '0 0 24 24', [
  ['polygon', { points: '12 3 21 12 12 21 3 12', fill: 'currentColor', stroke: 'none' }],
  ['circle', { cx: 19, cy: 5, r: 2, fill: 'currentColor', stroke: 'none' }],
]);

@Component({
  selector: 'docs-icon-custom-example',
  imports: [WjIcon],
  template: `
    <p><wj-icon [icon]="target" /> Stroke</p>
    <p><wj-icon [icon]="badge" /> Filled</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
    }

    p {
      margin: 0;
    }
  `,
})
export class IconCustomExample {
  protected readonly target = target;
  protected readonly badge = badge;
}
