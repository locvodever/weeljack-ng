import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
} from '@angular/core';
import { Step, StepList, StepPanel, StepPanels, Stepper } from '@openng/optimus-ui/stepper';
import {
  _OVERLAY_MOTION,
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _rovingFocus,
} from 'weeljack-ng/private';
import { WjStepList } from './step-list/step-list';
import { WjStepPanels } from './step-panels/step-panels';
import type { WjStepperPt, WjStepperValue } from './stepper-types';

/**
 * A stepper over Optimus's `p-stepper`: a task split into numbered steps, one panel at a time, in
 * a horizontal row. Declare a `wj-step-list` of `wj-step` children and a `wj-step-panels` of
 * `wj-step-panel` children; a step and its panel share a `value` (1, 2, 3 and so on), and `value`
 * here is the active one. Move between steps by setting it from your own buttons. Only
 * `wj-step-list` and `wj-step-panels` children render.
 *
 * The steps are a tab list with one Tab stop: Tab enters on the active step and the next Tab goes
 * on to the active panel's controls. Arrow Right and Arrow Left, Home and End move focus between
 * the enabled steps and wrap, without changing `value`; Enter or Space on a focused step activates
 * it (manual activation). Name the tab list with `ariaLabel` or `ariaLabelledBy` on `wj-step-list`.
 */
@Component({
  selector: 'wj-stepper',
  imports: [Stepper, StepList, Step, StepPanels, StepPanel, NgTemplateOutlet],
  templateUrl: './stepper.html',
  styleUrl: './stepper.css',
})
export class WjStepper {
  /** The value of the active step, whose panel shows. Keep it on a step that exists. */
  readonly value = model.required<WjStepperValue>();
  /** Disables every step but the active one, so only your own buttons move between steps. */
  readonly linear = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the stepper's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjStepperPt>();

  /** The one `wj-step-list` child. */
  protected readonly list = contentChild(WjStepList);
  /** The one `wj-step-panels` child. */
  protected readonly panels = contentChild(WjStepPanels);
  /** `safe` makes any motion skip itself under reduced motion (22 Q6). */
  protected readonly motion = _OVERLAY_MOTION;
  /** `pt` plus a neutral role: Optimus makes this root a tab list, yet it holds the panels too. */
  protected readonly rootPt = computed<WjStepperPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { role: 'presentation' }),
  );

  /**
   * Each step's `pt` with the ARIA its active state needs. Optimus puts `aria-current` on a
   * `role="presentation"` element, which axe rejects inside a tab list, and gives the `role="tab"`
   * button no `aria-selected`. So the attribute leaves the step and goes to the button; the marker
   * makes Optimus re-apply the removal whenever a step turns active.
   */
  protected readonly stepPts = computed(() => {
    const value = this.value();
    return new Map(
      (this.list()?.steps() ?? []).map((step) => {
        const active = step.value() === value;
        const header = { 'aria-selected': active, 'aria-current': active ? 'step' : undefined };
        const root = { 'aria-current': undefined, 'data-wj-active': active ? '' : undefined };
        return [
          step,
          _mergePartAttributes(_mergePartAttributes(step.pt(), 'header', header), 'root', root),
        ] as const;
      }),
    );
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    _checkWeeljackSetup('wj-stepper');
    _checkAriaOnHost('wj-stepper', 'Remove it: the steps and panels name themselves');
    // The enabled step buttons are one Tab stop, led by the active step.
    _rovingFocus(
      () => [...this.host.querySelectorAll<HTMLElement>('p-step-list [role="tab"]:not(:disabled)')],
      () => this.host.querySelector<HTMLElement>('p-step-list [aria-selected="true"]') ?? undefined,
    );
  }
}
