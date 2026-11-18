import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-progressbar` with {@link WjProgressBarHarness.with}. */
export interface WjProgressBarHarnessFilters extends BaseHarnessFilters {
  /** The accessible name, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** The bar's name and description attributes, each `null` when absent. */
export interface WjProgressBarAria {
  label: string | null;
  labelledBy: string | null;
  describedBy: string | null;
}

/** Test harness for `wj-progressbar`. Describes the bar as a user meets it, not how it is built. */
export class WjProgressBarHarness extends ComponentHarness {
  static hostSelector = 'wj-progressbar';

  private readonly bar = this.locatorFor('[role="progressbar"]');
  private readonly shown = this.locatorForOptional('[role="progressbar"] *:not(:has(*))');

  /** Finds the bars whose accessible name matches `options.label`. */
  static with(options: WjProgressBarHarnessFilters = {}): HarnessPredicate<WjProgressBarHarness> {
    return new HarnessPredicate(WjProgressBarHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getAccessibleName(), label),
    );
  }

  /** The accessible name: `aria-label`, else the text of the element `aria-labelledby` points at. */
  async getAccessibleName(): Promise<string> {
    const { label, labelledBy } = await this.getAriaAttributes();
    if (label) {
      return label;
    }
    if (labelledBy) {
      const target = await this.documentRootLocatorFactory().locatorForOptional(
        `[id="${labelledBy.replaceAll('"', '\\"')}"]`,
      )();
      return (await target?.text())?.trim() ?? '';
    }
    return '';
  }

  /** The value as a number (`aria-valuenow`), or `null` when the bar is indeterminate. */
  async getValue(): Promise<number | null> {
    const now = await (await this.bar()).getAttribute('aria-valuenow');
    return now === null ? null : Number(now);
  }

  /** `indeterminate` when there is no value, else `determinate`. */
  async getMode(): Promise<'determinate' | 'indeterminate'> {
    return (await this.getValue()) === null ? 'indeterminate' : 'determinate';
  }

  /** The text shown inside the fill, such as "40%", or `null` when none is visible. */
  async getDisplayedValue(): Promise<string | null> {
    const label = await this.shown();
    if (label === null || (await label.getCssValue('display')) === 'none') {
      return null;
    }
    const text = (await label.text()).trim();
    return text === '' ? null : text;
  }

  /** The name and description attributes on the `progressbar` element, `null` where absent. */
  async getAriaAttributes(): Promise<WjProgressBarAria> {
    const bar = await this.bar();
    return {
      label: await bar.getAttribute('aria-label'),
      labelledBy: await bar.getAttribute('aria-labelledby'),
      describedBy: await bar.getAttribute('aria-describedby'),
    };
  }
}
