import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-card` with {@link WjCardHarness.with}. */
export interface WjCardHarnessFilters extends BaseHarnessFilters {
  /** The title text (the `header` input or the `wjCardTitle` slot), as a string or a RegExp. */
  title?: string | RegExp;
}

/**
 * Test harness for `wj-card`. Describes the card as a user meets it and reads its parts from
 * Optimus's `data-pc-section` hooks, never from a class name. It is a container: the header
 * region, the content and the footer are inside it, so
 * `getHarness(WjButtonHarness.with({ label: 'Book' }))` reaches a button in the footer.
 *
 * Every family container harness (inplace, scrollpanel, splitter panel) follows this shape: the
 * state and text getters, a `with()` filter on the natural label, and the CDK container methods.
 */
export class WjCardHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-card';

  private readonly title = this.locatorForOptional('[data-pc-section="title"]');
  private readonly subtitle = this.locatorForOptional('[data-pc-section="subtitle"]');
  private readonly content = this.locatorFor('[data-pc-section="content"]');
  private readonly header = this.locatorForOptional('[data-pc-section="header"]');
  private readonly footer = this.locatorForOptional('[data-pc-section="footer"]');

  /** Finds the cards whose title text matches `options.title`. */
  static with(options: WjCardHarnessFilters = {}): HarnessPredicate<WjCardHarness> {
    return new HarnessPredicate(WjCardHarness, options).addOption(
      'title',
      options.title,
      (harness, title) => HarnessPredicate.stringMatches(harness.getTitle(), title),
    );
  }

  /** The title text, trimmed; empty when the card has no title. */
  async getTitle(): Promise<string> {
    return ((await (await this.title())?.text()) ?? '').trim();
  }

  /** The subtitle text, trimmed; empty when the card has no subtitle. */
  async getSubtitle(): Promise<string> {
    return ((await (await this.subtitle())?.text()) ?? '').trim();
  }

  /** The text of the content, trimmed. */
  async getContentText(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  /** Whether the card shows a header region (the `wjCardHeader` slot is filled). */
  async hasHeader(): Promise<boolean> {
    return (await this.header()) !== null;
  }

  /** Whether the card shows a footer (the `wjCardFooter` slot is filled). */
  async hasFooter(): Promise<boolean> {
    return (await this.footer()) !== null;
  }
}
