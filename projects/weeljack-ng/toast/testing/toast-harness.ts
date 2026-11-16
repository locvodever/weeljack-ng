import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { WjToastSeverity } from 'weeljack-ng/toast';

/** Criteria for finding a message with {@link WjToastMessageHarness.with}. */
export interface WjToastMessageHarnessFilters extends BaseHarnessFilters {
  /** The summary, as a string for an exact match or a RegExp. */
  summary?: string | RegExp;
  /** The colour role of the message. A message with no severity is `info`. */
  severity?: WjToastSeverity;
}

const SEVERITIES: readonly string[] = ['success', 'info', 'warn', 'error'];

function isSeverity(value: string | null): value is WjToastSeverity {
  return value !== null && SEVERITIES.includes(value);
}

/** Test harness for one open message of a `wj-toast`, as a user meets it. */
export class WjToastMessageHarness extends ComponentHarness {
  static hostSelector = 'wj-toast [role="alert"]';

  private readonly summary = this.locatorFor('[data-wj-summary]');
  private readonly detail = this.locatorFor('[data-wj-detail]');
  private readonly closeButton = this.locatorFor('button');

  /** Finds the messages that match `options`. */
  static with(options: WjToastMessageHarnessFilters = {}): HarnessPredicate<WjToastMessageHarness> {
    return new HarnessPredicate(WjToastMessageHarness, options)
      .addOption('summary', options.summary, (harness, summary) =>
        HarnessPredicate.stringMatches(harness.getSummary(), summary),
      )
      .addOption(
        'severity',
        options.severity,
        async (harness, severity) => (await harness.getSeverity()) === severity,
      );
  }

  /** The colour role of the message. */
  async getSeverity(): Promise<WjToastSeverity> {
    const severity = await (await this.host()).getAttribute('data-wj-severity');
    return isSeverity(severity) ? severity : 'info';
  }

  /** The summary text. */
  async getSummary(): Promise<string> {
    return (await (await this.summary()).text()).trim();
  }

  /** The detail text. Empty when the message has none. */
  async getDetail(): Promise<string> {
    return (await (await this.detail()).text()).trim();
  }

  /** The accessible name of the close button. */
  async getCloseLabel(): Promise<string> {
    return (await (await this.closeButton()).getAttribute('aria-label')) ?? '';
  }

  /** Clicks the close button. The message leaves with its motion, unless the reader reduces it. */
  async close(): Promise<void> {
    await (await this.closeButton()).click();
  }
}

/** Test harness for `wj-toast`. Describes the messages on screen, not how they are built. */
export class WjToastHarness extends ComponentHarness {
  static hostSelector = 'wj-toast';

  /** The open messages, in the order they are on screen. */
  async getMessages(filters: WjToastMessageHarnessFilters = {}): Promise<WjToastMessageHarness[]> {
    return this.locatorForAll(WjToastMessageHarness.with(filters))();
  }
}
