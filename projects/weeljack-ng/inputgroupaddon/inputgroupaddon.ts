import { Component, input } from '@angular/core';
import { InputGroupAddon } from '@openng/optimus-ui/inputgroupaddon';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjInputGroupAddonPt } from './inputgroupaddon-types';

/**
 * A text or button cell at the edge of a `wj-inputgroup`: a unit, a currency, a scheme such as
 * `https://`, or a `wj-button`. Project it before or after the control. Its border is drawn by the
 * group, so it joins the control without a double line, and its outer corners are rounded.
 *
 * Keep the text to one short word or symbol: the addon keeps its width and the control shrinks.
 * The text is not part of the control's name. Put the unit in the control's label, or point the
 * control's `aria-describedby` at the addon's `id`. An addon is not a Tab stop; a `wj-button`
 * inside it is. Used outside a `wj-inputgroup` it keeps Optimus's standalone look, which is not a
 * documented use.
 */
@Component({
  selector: 'wj-inputgroupaddon',
  imports: [InputGroupAddon],
  templateUrl: './inputgroupaddon.html',
  styleUrl: './inputgroupaddon.css',
})
export class WjInputGroupAddon {
  /**
   * Pass-through for the addon's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjInputGroupAddonPt>();

  constructor() {
    _checkWeeljackSetup('wj-inputgroupaddon');
  }
}
