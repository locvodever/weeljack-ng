import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a step with {@link WjStepsItemHarness.with}. */
export interface WjStepsItemHarnessFilters extends BaseHarnessFilters {
  /** The step's visible label, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * One step, as a user meets it: a number and a label, current or not, usable or not. Found
 * through {@link WjStepsHarness.getSteps}.
 */
export class WjStepsItemHarness extends ComponentHarness {
  static hostSelector = '[data-pc-section="menuitem"]';

  private readonly link = this.locatorFor('a');
  private readonly number = this.locatorFor('a > span:first-child');
  private readonly label = this.locatorFor('a > span:last-child');

  /** Finds the steps whose visible label matches `options.label`. */
  static with(options: WjStepsItemHarnessFilters = {}): HarnessPredicate<WjStepsItemHarness> {
    return new HarnessPredicate(WjStepsItemHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The visible label of the step, trimmed. */
  async getLabel(): Promise<string> {
    return (await (await this.label()).text()).trim();
  }

  /** The number drawn in the step's circle: its position among the visible steps, from 1. */
  async getNumber(): Promise<number> {
    return Number((await (await this.number()).text()).trim());
  }

  /** Whether the step is the current one (`aria-current="step"`). */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-current')) === 'step';
  }

  /**
   * Whether the step is inert: it does nothing when clicked and is not a Tab stop. Every step but
   * the current one is inert while the steps are read-only.
   */
  async isDisabled(): Promise<boolean> {
    return (await (await this.link()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the step. An inert step does nothing. */
  async click(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.link()).click(modifiers);
  }

  /** Moves focus to the step's link. */
  async focus(): Promise<void> {
    await (await this.link()).focus();
  }

  /** Whether the step's link has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.link()).isFocused();
  }
}

/**
 * Test harness for `wj-steps`: the steps in order, the current one, and whether they can be
 * selected. Steps with no visible item render nothing: there are no steps, and `isReadonly`
 * throws.
 */
export class WjStepsHarness extends ComponentHarness {
  static hostSelector = 'wj-steps';

  private readonly nav = this.locatorForOptional('nav');

  /** The steps, in order, optionally only those whose label matches. */
  async getSteps(filters: WjStepsItemHarnessFilters = {}): Promise<WjStepsItemHarness[]> {
    return this.locatorForAll(WjStepsItemHarness.with(filters))();
  }

  /** The visible label of each step, in order. */
  async getStepLabels(): Promise<string[]> {
    const labels: string[] = [];
    for (const step of await this.getSteps()) {
      labels.push(await step.getLabel());
    }
    return labels;
  }

  /** The position of the current step among the steps, from 0, or -1 when none is current. */
  async getActiveIndex(): Promise<number> {
    const steps = await this.getSteps();
    for (const [index, step] of steps.entries()) {
      if (await step.isActive()) {
        return index;
      }
    }
    return -1;
  }

  /** The label of the current step, or `null` when none is. */
  async getActiveLabel(): Promise<string | null> {
    for (const step of await this.getSteps()) {
      if (await step.isActive()) {
        return step.getLabel();
      }
    }
    return null;
  }

  /** Whether the steps are read-only. Throws when nothing renders. */
  async isReadonly(): Promise<boolean> {
    const nav = await this.nav();
    if (nav === null) {
      throw new Error(
        'wj-steps: nothing renders, so there is no read-only state: no visible steps',
      );
    }
    return nav.hasClass('p-readonly');
  }

  /** Clicks the first step whose visible label is `label`, and throws when there is none. */
  async selectStep(label: string | RegExp): Promise<void> {
    const [step] = await this.getSteps({ label });
    if (step === undefined) {
      throw new Error(`wj-steps: no step with the label ${String(label)}`);
    }
    await step.click();
  }
}
