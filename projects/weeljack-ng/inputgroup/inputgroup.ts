import { Component, input } from '@angular/core';
import { InputGroup } from '@openng/optimus-ui/inputgroup';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjInputGroupPt } from './inputgroup-types';

/**
 * Joins a control and its addons into one shape: a single row whose outer corners are rounded and
 * whose inner corners are square. Project a text input (`input[wjInputText]`) and a `wj-select`
 * side by side; the controls share the width equally.
 *
 * Size the input group, not the controls. The row never wraps: the controls shrink and nothing
 * else does. Only those two controls are covered. A password, a float or ifta label, an icon field
 * and a `wj-button` placed directly inside the group are not supported.
 *
 * Inside a `wj-field` a single control registers with the field as it would bare. With two
 * controls the field becomes a labelled group, so give each control its own name. The group adds
 * no role: put `role="group"` and `aria-labelledby` on the host to caption it.
 */
@Component({
  selector: 'wj-inputgroup',
  imports: [InputGroup],
  templateUrl: './inputgroup.html',
  styleUrl: './inputgroup.css',
})
export class WjInputGroup {
  /**
   * Pass-through for the input group's parts. Tracks Optimus: its part names and attributes
   * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
   * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjInputGroupPt>();

  constructor() {
    _checkWeeljackSetup('wj-inputgroup');
  }
}
