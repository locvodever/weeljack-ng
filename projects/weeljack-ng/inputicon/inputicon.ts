import { Component, input } from '@angular/core';
import { InputIcon } from '@openng/optimus-ui/inputicon';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjInputIconPt } from './inputicon-types';

/**
 * The icon inside a `wj-iconfield`. Project your own icon, such as an inline SVG at `1em` square
 * drawn in `currentColor`: it is decorative, so mark it `aria-hidden="true"`. Put it before the
 * input for an icon at the input's start and after it for one at its end: its side follows its
 * place, and it takes the inset of that side only.
 *
 * It is not a control. It takes no focus and passes pointer events to the input under it, so a
 * click anywhere in the visible box focuses the input. For a clickable control beside an input,
 * use `wj-inputgroupaddon` with `wj-button`.
 */
@Component({
  selector: 'wj-inputicon',
  imports: [InputIcon],
  templateUrl: './inputicon.html',
  styleUrl: './inputicon.css',
})
export class WjInputIcon {
  /**
   * Pass-through for the input icon's parts. Tracks Optimus: its part names and attributes
   * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
   * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjInputIconPt>();

  constructor() {
    _checkWeeljackSetup('wj-inputicon');
  }
}
