import { Component, input } from '@angular/core';
import { IftaLabel } from '@openng/optimus-ui/iftalabel';
import { _checkNotInField, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjIftaLabelPt } from './iftalabel-types';

/**
 * A label fixed at the top inside a control, over Optimus's `p-iftalabel`. Project the control,
 * then its `<label>`: the label names the control, so put it after the control and tie it with
 * `for` (or, for `wj-select`, `ariaLabelledBy`). Optimus pads the control's top to make room, so a
 * default text input is 59 px tall.
 *
 * It replaces `wj-field`'s label for its one control and never goes inside a `wj-field` (a dev-mode
 * `WJ0100` warning says so). A hint or an error under it is your own markup, linked through the
 * control's `ariaDescribedBy` or `aria-describedby`.
 *
 * Size the ifta label, not the control: a control with no width of its own fills it.
 */
@Component({
  selector: 'wj-iftalabel',
  imports: [IftaLabel],
  templateUrl: './iftalabel.html',
  styleUrl: './iftalabel.css',
})
export class WjIftaLabel {
  /**
   * Pass-through for the ifta label's parts. Tracks Optimus: its part names and attributes
   * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
   * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjIftaLabelPt>();

  constructor() {
    _checkWeeljackSetup('wj-iftalabel');
    _checkNotInField('wj-iftalabel');
  }
}
