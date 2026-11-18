import { Component, input } from '@angular/core';
import { Divider } from '@openng/optimus-ui/divider';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjDividerAlign, WjDividerOrientation, WjDividerPt } from './divider-types';

/**
 * A line that separates content, over Optimus's `p-divider`: horizontal or vertical, with optional
 * content in it. A vertical divider fills the height of the flex or grid row it sits in. Optimus
 * gives it `role="separator"` and `aria-orientation`; a separator's children are presentational, so
 * screen readers skip the content. The divider is not focusable.
 */
@Component({
  selector: 'wj-divider',
  imports: [Divider],
  templateUrl: './divider.html',
  styleUrl: './divider.css',
  host: { '[attr.data-wj-orientation]': 'orientation()' },
})
export class WjDivider {
  /** The direction the line runs. Optimus calls it `layout`. */
  readonly orientation = input<WjDividerOrientation>('horizontal');
  /**
   * Where the content sits on the line. Left unset, it renders centred. Use `left`, `center` or
   * `right` on a horizontal divider and `top`, `center` or `bottom` on a vertical one.
   */
  readonly align = input<WjDividerAlign>();
  /**
   * Pass-through for the divider's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjDividerPt>();

  constructor() {
    _checkWeeljackSetup('wj-divider');
  }
}
