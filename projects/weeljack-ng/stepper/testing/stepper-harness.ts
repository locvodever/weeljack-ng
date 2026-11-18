import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type ModifierKeys,
} from '@angular/cdk/testing';

/** Criteria for finding a step with {@link WjStepHarness.with}. */
export interface WjStepHarnessFilters extends BaseHarnessFilters {
  /** The step's title, as a string for an exact match or a RegExp. */
  title?: string | RegExp;
}

/**
 * Test harness for one step of a `wj-stepper`. Describes the step as a user meets it: its number
 * and title, whether it is the active step and whether it is disabled. A step's own `wj-step` host
 * renders nothing, so this finds the step the `wj-stepper` drew.
 */
export class WjStepHarness extends ComponentHarness {
  static hostSelector = '[data-wj-part="step"]';

  private readonly button = this.locatorFor('button');
  private readonly number = this.locatorFor('[data-pc-section="number"]');
  private readonly title = this.locatorFor('[data-pc-section="title"]');

  /** Finds the steps whose title matches `options.title`. */
  static with(options: WjStepHarnessFilters = {}): HarnessPredicate<WjStepHarness> {
    return new HarnessPredicate(WjStepHarness, options).addOption(
      'title',
      options.title,
      (harness, title) => HarnessPredicate.stringMatches(harness.getTitle(), title),
    );
  }

  /** The visible title of the step, trimmed. */
  async getTitle(): Promise<string> {
    return (await (await this.title()).text()).trim();
  }

  /** The number shown in the step's circle, which is the step's `value`. */
  async getNumber(): Promise<number> {
    return Number((await (await this.number()).text()).trim());
  }

  /** Whether the step is the active one. */
  async isActive(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the step is disabled: it cannot be activated and takes no focus. */
  async isDisabled(): Promise<boolean> {
    return (await this.button()).getProperty<boolean>('disabled');
  }

  /** Clicks the step, which makes it the active one. */
  async select(modifiers: ModifierKeys = {}): Promise<void> {
    await (await this.button()).click(modifiers);
  }

  /** Moves focus to the step. */
  async focus(): Promise<void> {
    await (await this.button()).focus();
  }

  /** Whether the step has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.button()).isFocused();
  }
}

/** Test harness for `wj-stepper`: its steps, the active one and the panel on show. */
export class WjStepperHarness extends ComponentHarness {
  static hostSelector = 'wj-stepper';

  private readonly activePanel = this.locatorForOptional('[role="tabpanel"][data-p-active="true"]');

  /** The steps, in order, optionally only those whose title matches. */
  async getSteps(filters: WjStepHarnessFilters = {}): Promise<WjStepHarness[]> {
    return this.locatorForAll(WjStepHarness.with(filters))();
  }

  /** The active step, or `null` when no step matches `value`. */
  async getActiveStep(): Promise<WjStepHarness | null> {
    const steps = await this.getSteps();
    const active = await Promise.all(steps.map((step) => step.isActive()));
    return steps[active.indexOf(true)] ?? null;
  }

  /** The title of every step, in order. */
  async getStepTitles(): Promise<string[]> {
    return Promise.all((await this.getSteps()).map((step) => step.getTitle()));
  }

  /** The text of the panel on show, trimmed, or `null` when none shows. */
  async getActivePanelText(): Promise<string | null> {
    const panel = await this.activePanel();
    return panel ? (await panel.text()).trim() : null;
  }
}
