import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-autocomplete` with {@link WjAutoCompleteHarness.with}. */
export interface WjAutoCompleteHarnessFilters extends BaseHarnessFilters {
  /** The input's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /** The text in the input (the typed text or the picked label), string or RegExp. */
  text?: string | RegExp;
}

/**
 * Test harness for `wj-autocomplete`. Describes the control as a user meets it. The component
 * emits `query` 300 ms after the last keystroke, so after {@link typeText} wait for the list to
 * open (`expect.poll(() => autocomplete.isOpen())`) rather than reading it at once.
 */
export class WjAutoCompleteHarness extends ComponentHarness {
  static hostSelector = 'wj-autocomplete';

  private readonly input = this.locatorFor('[role="combobox"]');
  private readonly suggestions = this.locatorForAll('[role="option"][aria-selected]');
  private readonly empty = this.locatorForOptional('[role="option"]:not([aria-selected])');

  /** Finds the autocompletes that match `options`. */
  static with(options: WjAutoCompleteHarnessFilters = {}): HarnessPredicate<WjAutoCompleteHarness> {
    return new HarnessPredicate(WjAutoCompleteHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches((await harness.getAriaAttributes()).label, ariaLabel),
      )
      .addOption('text', options.text, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getText(), text),
      );
  }

  /** The text in the input: what was typed, or the picked suggestion's label. */
  async getText(): Promise<string> {
    return (await (await this.input()).getProperty<string>('value')) || '';
  }

  /** Types `text` after what is in the input, one character at a time, as a user does. */
  async typeText(text: string): Promise<void> {
    await (await this.input()).sendKeys(text);
  }

  /** Empties the input, the way a user does with select-all and Delete. */
  async clear(): Promise<void> {
    await (await this.input()).clear();
  }

  /** Whether the suggestion list is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-expanded')) === 'true';
  }

  /** Closes the list with Escape, as a user does. Focus stays on the input. */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.input()).sendKeys(TestKey.ESCAPE);
    }
  }

  /** The labels of the suggestions in the open list, in order. Empty while the list is closed. */
  async getSuggestionLabels(): Promise<string[]> {
    return Promise.all((await this.suggestions()).map((suggestion) => suggestion.text()));
  }

  /** The text of the empty message the open list shows, `null` while it has suggestions. */
  async getEmptyMessage(): Promise<string | null> {
    return (await this.empty())?.text() ?? null;
  }

  /** Picks the suggestion with exactly this label by clicking it. Throws when there is none. */
  async selectSuggestion(label: string): Promise<void> {
    for (const suggestion of await this.suggestions()) {
      if ((await suggestion.text()) === label) {
        await suggestion.click();
        return;
      }
    }
    throw new Error(`wj-autocomplete has no suggestion labelled "${label}".`);
  }

  /** Whether the control cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  /** Whether the control is required. */
  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the control shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id` of the input, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.input()).getAttribute('id')) ?? '';
  }

  /** The ARIA name and description attributes as set on the input, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const input = await this.input();
    return {
      label: await input.getAttribute('aria-label'),
      labelledBy: await input.getAttribute('aria-labelledby'),
      describedBy: await input.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus to the input. Does not open the list. */
  async focus(): Promise<void> {
    await (await this.input()).focus();
  }

  /** Removes focus from the input. */
  async blur(): Promise<void> {
    await (await this.input()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.input()).isFocused();
  }
}
