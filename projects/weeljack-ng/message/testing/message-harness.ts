import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-message` with {@link WjMessageHarness.with}. */
export interface WjMessageHarnessFilters extends BaseHarnessFilters {
  /** The visible text, as a string for an exact match or a RegExp. */
  text?: string | RegExp;
}

/** Test harness for `wj-message`. Describes the message as a user meets it, not how it is built. */
export class WjMessageHarness extends ComponentHarness {
  static hostSelector = 'wj-message';

  private readonly live = this.locatorFor('[role]');
  private readonly closeButton = this.locatorForOptional('button');

  /** Finds the messages whose visible text matches `options.text`. */
  static with(options: WjMessageHarnessFilters = {}): HarnessPredicate<WjMessageHarness> {
    return new HarnessPredicate(WjMessageHarness, options).addOption(
      'text',
      options.text,
      (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** The visible text, trimmed. The close button has a name but no text, so it adds none. */
  async getText(): Promise<string> {
    return (await (await this.live()).text()).trim();
  }

  /** How the message is announced: `alert` (error, warn) or `status` (the other severities). */
  async getRole(): Promise<'alert' | 'status'> {
    const role = await (await this.live()).getAttribute('role');
    return role === 'alert' ? 'alert' : 'status';
  }

  /** Whether the message has a close button. */
  async isClosable(): Promise<boolean> {
    return (await this.closeButton()) !== null;
  }

  /** Clicks the close button. The message hides itself once its leave motion has ended. */
  async close(): Promise<void> {
    const button = await this.closeButton();
    if (button === null) {
      throw new Error('wj-message: this message is not closable');
    }
    await button.click();
  }

  /** Whether the message has been closed and hidden: out of the layout and the accessibility tree. */
  async isClosed(): Promise<boolean> {
    return (await (await this.host()).getAttribute('hidden')) !== null;
  }

  /** The accessible name of the close button, `null` when the message is not closable. */
  async getCloseButtonLabel(): Promise<string | null> {
    return (await (await this.closeButton())?.getAttribute('aria-label')) ?? null;
  }
}
