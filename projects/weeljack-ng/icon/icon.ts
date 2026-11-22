import { Component, booleanAttribute, input } from '@angular/core';
import type { WjIconDef } from './icon-types';

/**
 * An inline SVG icon that takes the text's size and colour. It draws one {@link WjIconDef} as an
 * `svg` that is `1em` square and `currentColor`, on the text baseline: size it with `font-size`
 * and colour it with `color` on the icon or its parent.
 *
 * An icon is decorative by default (`aria-hidden="true"`), for use beside text that says the same.
 * Set `label` only when the icon carries meaning on its own: the svg then gets `role="img"` and
 * that name. `label` is rendered as an attribute value, never as HTML. An icon is never focusable.
 */
@Component({
  selector: 'wj-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  host: {
    '[class.wj-icon-spin]': 'spin()',
    '[attr.data-icon]': 'icon().name',
  },
})
export class WjIcon {
  /** The icon to draw: one of the set's `wjIcon*` constants, or your own from `wjIconDef`. */
  readonly icon = input.required<WjIconDef>();

  /** The icon's accessible name. Leave it unset for a decorative icon, which screen readers skip. */
  readonly label = input<string>();

  /** Turns the icon, as a loading indicator. It stands still under reduced motion. */
  readonly spin = input(false, { transform: booleanAttribute });
}
