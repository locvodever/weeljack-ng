import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-timeline` with {@link WjTimelineHarness.with}. */
export interface WjTimelineHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/**
 * Test harness for `wj-timeline`. Describes the timeline as a user meets it: the text on each side
 * of every event, in order, and the way it runs.
 */
export class WjTimelineHarness extends ComponentHarness {
  static hostSelector = 'wj-timeline';

  private readonly root = this.locatorFor('.p-timeline');
  private readonly contents = this.locatorForAll('.p-timeline-event-content');
  private readonly opposites = this.locatorForAll('.p-timeline-event-opposite');

  /** Finds the timelines whose name matches `options.name`. */
  static with(options: WjTimelineHarnessFilters = {}): HarnessPredicate<WjTimelineHarness> {
    return new HarnessPredicate(WjTimelineHarness, options).addOption(
      'name',
      options.name,
      async (harness, name) => HarnessPredicate.stringMatches(await harness.getName(), name),
    );
  }

  /**
   * The list's name: its `aria-label`, else the text of the element its `aria-labelledby` points
   * at, else an empty string.
   */
  async getName(): Promise<string> {
    const root = await this.root();
    const label = await root.getAttribute('aria-label');
    if (label !== null) {
      return label;
    }
    const labelledBy = await root.getAttribute('aria-labelledby');
    if (labelledBy === null) {
      return '';
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(`#${labelledBy}`)();
    return named === null ? '' : named.text();
  }

  /** The text of each event's content, in order: an empty string for an event with none. */
  async getEventTexts(): Promise<string[]> {
    return texts(await this.contents());
  }

  /** The text of each event's opposite side, in order: an empty string for an event with none. */
  async getOppositeTexts(): Promise<string[]> {
    return texts(await this.opposites());
  }

  /** The way the timeline runs, from the `orientation` input (Optimus's `layout`). */
  async getOrientation(): Promise<'vertical' | 'horizontal'> {
    const horizontal = await (await this.root()).hasClass('p-timeline-horizontal');
    return horizontal ? 'horizontal' : 'vertical';
  }
}

async function texts(elements: TestElement[]): Promise<string[]> {
  const found: string[] = [];
  for (const element of elements) {
    found.push((await element.text()).trim());
  }
  return found;
}
