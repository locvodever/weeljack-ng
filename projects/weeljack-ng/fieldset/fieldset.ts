import { Component, booleanAttribute, computed, input, model } from '@angular/core';
import { Fieldset } from '@openng/optimus-ui/fieldset';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _wjId,
} from 'weeljack-ng/private';
import type { WjFieldsetPt } from './fieldset-types';

/**
 * A group of related content under a required `legend`, over Optimus's `p-fieldset`: a native
 * `fieldset` named by its legend. `toggleable` adds a button in the legend that collapses the
 * content, and `collapsed` is a two-way model that reports every toggle, a click or a key press.
 * It is not a form control and labels no control: use `wj-field` for that.
 */
@Component({
  selector: 'wj-fieldset',
  imports: [Fieldset],
  templateUrl: './fieldset.html',
  styleUrl: './fieldset.css',
})
export class WjFieldset {
  /** The group's name. Rendered as text, never as HTML. It also names the toggle button. */
  readonly legend = input.required<string>();
  /** Adds a button in the legend that collapses and expands the content. */
  readonly toggleable = input(false, { transform: booleanAttribute });
  /** Whether the content is collapsed. Two-way: `[(collapsed)]`. */
  readonly collapsed = model(false);
  /**
   * Pass-through for the fieldset's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjFieldsetPt>();

  protected readonly motion = _OVERLAY_MOTION;
  private readonly legendId = _wjId('fieldset-legend');

  /**
   * `pt` forwarded as given, plus what this wrapper routes (FR-43's gap fixes): the plus icon
   * hidden from assistive technology like the minus icon, and a real legend id that labels the
   * region (Optimus points it at the toggle's id, which a non-toggleable fieldset does not have).
   */
  protected readonly partAttributes = computed<WjFieldsetPt>(() => {
    const legend = _mergePartAttributes(this.pt(), 'legend', { id: this.legendId });
    const icon = _mergePartAttributes(legend, 'toggleIcon', { 'aria-hidden': 'true' });
    return _mergePartAttributes(icon, 'contentContainer', { 'aria-labelledby': this.legendId });
  });

  constructor() {
    _checkWeeljackSetup('wj-fieldset');
    _checkAriaOnHost('wj-fieldset', 'Use the legend input to name the group');
  }
}
