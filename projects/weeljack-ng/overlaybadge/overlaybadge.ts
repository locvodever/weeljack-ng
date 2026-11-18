import { Component, input } from '@angular/core';
import { OverlayBadge } from '@openng/optimus-ui/overlaybadge';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type {
  WjOverlayBadgePt,
  WjOverlayBadgeSeverity,
  WjOverlayBadgeSize,
} from './overlaybadge-types';

/**
 * Puts a badge on the top-end corner of the projected content, usually a button. With no `value`
 * the badge is an 8 px dot. The badge is display only: it adds no Tab stop and passes the pointer
 * through, so a click on it reaches the wrapped control.
 *
 * The badge is not announced with the control. Name the wrapped control with the badge's
 * meaning, for example `ariaLabel="Notifications, 4 unread"`, and keep room above and beside the
 * control: the badge reaches past its corner.
 */
@Component({
  selector: 'wj-overlaybadge',
  imports: [OverlayBadge],
  templateUrl: './overlaybadge.html',
  styleUrl: './overlaybadge.css',
})
export class WjOverlayBadge {
  /** Text of the badge, rendered as text and never as HTML. Unset or empty gives the dot; `0` is shown. */
  readonly value = input<string | number>();
  /** Colour role of the badge. */
  readonly severity = input<WjOverlayBadgeSeverity>();
  /** Size step of the badge. */
  readonly size = input<WjOverlayBadgeSize>();
  /**
   * Pass-through for the parts; `pcBadge` reaches the badge's own parts. Tracks Optimus: its part
   * names and attributes follow the installed `@openng/optimus-ui` minor and are outside this
   * component's stable API; changes to them ship only in the release that takes a new Optimus
   * minor and are not breaking.
   */
  readonly pt = input<WjOverlayBadgePt>();

  constructor() {
    _checkWeeljackSetup('wj-overlaybadge');
    _checkAriaOnHost(
      'wj-overlaybadge',
      'An overlay badge has no aria inputs: name the wrapped control with the badge’s meaning instead',
    );
  }
}
