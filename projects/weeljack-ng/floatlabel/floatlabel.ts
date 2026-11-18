import { Component, input } from '@angular/core';
import { FloatLabel } from '@openng/optimus-ui/floatlabel';
import { _checkNotInField, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjFloatLabelPt, WjFloatLabelVariant } from './floatlabel-types';

/**
 * A label that rests inside a control and floats away when the control has focus or a value, over
 * Optimus's `p-floatlabel`. Project the control, then its `<label>`: the label names the control,
 * so put it after the control and tie it with `for` (or, for `wj-select`, `ariaLabelledBy`).
 *
 * It replaces `wj-field`'s label for its one control and never goes inside a `wj-field` (a dev-mode
 * `WJ0100` warning says so). A hint or an error under it is your own markup, linked through the
 * control's `ariaDescribedBy` or `aria-describedby`.
 *
 * Size the float label, not the control: a control with no width of its own fills it.
 */
@Component({
  selector: 'wj-floatlabel',
  imports: [FloatLabel],
  templateUrl: './floatlabel.html',
  styleUrl: './floatlabel.css',
})
export class WjFloatLabel {
  /** Where the label goes when it floats. */
  readonly variant = input<WjFloatLabelVariant>('over');
  /**
   * Pass-through for the float label's parts. Tracks Optimus: its part names and attributes
   * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
   * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjFloatLabelPt>();

  constructor() {
    _checkWeeljackSetup('wj-floatlabel');
    _checkNotInField('wj-floatlabel');
  }
}
