import { Component, input } from '@angular/core';
import { Fluid } from '@openng/optimus-ui/fluid';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjFluidPt } from './fluid-types';

/**
 * Makes every control placed directly inside it span the full width. Size the `wj-fluid`, not the
 * controls: its direct children fill the width it is given, and the spacing between them is the
 * app's own.
 *
 * Only direct children are covered: a control inside your own nested layout (a flex row, say)
 * keeps its own width. Optimus's Fluid works through dependency injection, which cannot cross a
 * wrapper host, so this component does the same job in CSS instead.
 */
@Component({
  selector: 'wj-fluid',
  imports: [Fluid],
  templateUrl: './fluid.html',
  styleUrl: './fluid.css',
})
export class WjFluid {
  /**
   * Pass-through for the fluid's parts. Tracks Optimus: its part names and attributes
   * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
   * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjFluidPt>();

  constructor() {
    _checkWeeljackSetup('wj-fluid');
  }
}
