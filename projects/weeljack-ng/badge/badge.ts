import { Component, input } from '@angular/core';
import { Badge } from '@openng/optimus-ui/badge';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjBadgePt, WjBadgeSeverity, WjBadgeSize } from './badge-types';

/**
 * A small count or status label, over Optimus's `p-badge`. With no `value` it is an 8 px dot. It
 * is display only: it takes no focus and adds no Tab stop, and its text is read as it stands.
 *
 * A dot carries nothing for assistive technology, and colour alone is not meaning: say what a
 * badge or dot stands for in text beside it. To put a badge on another element, use
 * `wj-overlaybadge`.
 */
@Component({
  selector: 'wj-badge',
  imports: [Badge],
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class WjBadge {
  /** Text of the badge, rendered as text and never as HTML. Unset or empty gives the dot; `0` is shown. */
  readonly value = input<string | number>();
  /** Colour role. */
  readonly severity = input<WjBadgeSeverity>();
  /** Size step. */
  readonly size = input<WjBadgeSize>();
  /**
   * Pass-through for the badge's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjBadgePt>();

  constructor() {
    _checkWeeljackSetup('wj-badge');
    _checkAriaOnHost(
      'wj-badge',
      'A badge has no aria inputs: its text is its value, so say what it means in text beside it',
    );
  }
}
