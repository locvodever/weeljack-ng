import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-metergroup` with {@link WjMeterGroupHarness.with}. */
export interface WjMeterGroupHarnessFilters extends BaseHarnessFilters {
  /** The accessible name, as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/** One legend entry: its text and the percentage the legend shows for it. */
export interface WjMeterGroupItem {
  label: string;
  percent: number;
}

/** The meter's name and description attributes, each `null` when absent. */
export interface WjMeterGroupAria {
  label: string | null;
  labelledBy: string | null;
  describedBy: string | null;
}

/** "Apps (16%)": the label, then the percentage in brackets at the very end. */
const LEGEND_ENTRY = /^(?<label>[\s\S]*) \((?<percent>[^()]*)%\)$/u;

/** Test harness for `wj-metergroup`. Describes the meter as a user meets it, not how it is built. */
export class WjMeterGroupHarness extends ComponentHarness {
  static hostSelector = 'wj-metergroup';

  private readonly meter = this.locatorFor('[role="meter"]');
  private readonly legend = this.locatorForAll('[role="meter"] ol > li');

  /** Finds the meter groups whose accessible name matches `options.label`. */
  static with(options: WjMeterGroupHarnessFilters = {}): HarnessPredicate<WjMeterGroupHarness> {
    return new HarnessPredicate(WjMeterGroupHarness, options).addOption(
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

  /** The legend, entry by entry: each label and the percentage shown beside it. */
  async getItems(): Promise<WjMeterGroupItem[]> {
    const entries = await this.legend();
    return Promise.all(
      entries.map(async (entry) => {
        const text = (await entry.text()).trim();
        const groups = LEGEND_ENTRY.exec(text)?.groups;
        return { label: groups?.['label'] ?? text, percent: Number(groups?.['percent']) };
      }),
    );
  }

  /** The rounded total of all items, as a percentage (`aria-valuenow`). */
  async getTotalPercent(): Promise<number> {
    return Number(await (await this.meter()).getAttribute('aria-valuenow'));
  }

  /** What assistive technology reads as the value: the legend as one line, or `null` when empty. */
  async getValueText(): Promise<string | null> {
    return (await this.meter()).getAttribute('aria-valuetext');
  }

  /** The name and description attributes on the `meter` element, `null` where absent. */
  async getAriaAttributes(): Promise<WjMeterGroupAria> {
    const meter = await this.meter();
    return {
      label: await meter.getAttribute('aria-label'),
      labelledBy: await meter.getAttribute('aria-labelledby'),
      describedBy: await meter.getAttribute('aria-describedby'),
    };
  }
}
