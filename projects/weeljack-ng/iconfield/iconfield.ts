import { Component, input } from '@angular/core';
import { IconField } from '@openng/optimus-ui/iconfield';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjIconFieldPt } from './iconfield-types';

/**
 * Puts an icon inside a text input, at its start or end. Project a text input, with a
 * `wj-inputicon` before it for an icon at its start and one after it for an icon at its end: an
 * icon's side follows its place, and the input pads that side so typed text never runs under it.
 *
 * Size the icon field, not the input: an input with no width of its own fills it, so a trailing
 * icon sits at the input's end. Only a text input (`input[wjInputText]`) is covered. Inside a
 * `wj-field` the input registers with the field as it would bare.
 */
@Component({
  selector: 'wj-iconfield',
  imports: [IconField],
  templateUrl: './iconfield.html',
  styleUrl: './iconfield.css',
})
export class WjIconField {
  /**
   * Pass-through for the icon field's parts. Tracks Optimus: its part names and attributes
   * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
   * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjIconFieldPt>();

  constructor() {
    _checkWeeljackSetup('wj-iconfield');
  }
}
