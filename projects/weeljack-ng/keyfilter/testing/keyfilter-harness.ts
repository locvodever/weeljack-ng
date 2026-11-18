import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding an `input[wjKeyFilter]` with {@link WjKeyFilterHarness.with}. */
export interface WjKeyFilterHarnessFilters extends BaseHarnessFilters {
  /** The `placeholder`, as a string for an exact match or a RegExp. */
  placeholder?: string | RegExp;
}

/** Test harness for `input[wjKeyFilter]`. Types and pastes the way a user does. */
export class WjKeyFilterHarness extends ComponentHarness {
  static hostSelector = 'input[wjKeyFilter]';

  /** Finds the inputs whose `placeholder` matches `options.placeholder`. */
  static with(options: WjKeyFilterHarnessFilters = {}): HarnessPredicate<WjKeyFilterHarness> {
    return new HarnessPredicate(WjKeyFilterHarness, options).addOption(
      'placeholder',
      options.placeholder,
      async (harness, placeholder) =>
        HarnessPredicate.stringMatches(await harness.getPlaceholder(), placeholder),
    );
  }

  /** The text in the input: only what the filter accepted. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /**
   * Types `text` at the end one key at a time, as a user would: each key is offered to the filter
   * as a `keypress`, and the character is added (with an `input` event) only when the filter let
   * it through. CDK's `sendKeys` cannot be used here, because it adds every character whether or
   * not the key was blocked.
   */
  async typeText(text: string): Promise<void> {
    const host = await this.host();
    for (const character of text) {
      const code = character.charCodeAt(0);
      const blocked = await offer(host, 'keypress', { which: code, keyCode: code, charCode: code });
      if (!blocked) {
        await this.insert(host, character);
      }
    }
  }

  /**
   * Pastes `text` at the end: the filter sees a `paste` carrying it, and the text is added (with
   * an `input` event) only when the filter let it through.
   */
  async pasteText(text: string): Promise<void> {
    const host = await this.host();
    const blocked = await offer(host, 'paste', { clipboardData: { getData: () => text } });
    if (!blocked) {
      await this.insert(host, text);
    }
  }

  /** Empties the input and the form value, as a form reset does. */
  async clear(): Promise<void> {
    await (await this.host()).clear();
  }

  /** Whether the input cannot be edited or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** The `placeholder`, or `null` when the input has none. */
  async getPlaceholder(): Promise<string | null> {
    return (await this.host()).getAttribute('placeholder');
  }

  /** Moves focus to the input. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Removes focus from the input. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  private async insert(host: TestElement, text: string): Promise<void> {
    await host.setInputValue((await this.getValue()) + text);
    await host.dispatchEvent('input');
  }
}

/**
 * Dispatches `name` with `data` and reports whether a listener called `preventDefault()` on it.
 * `TestElement.dispatchEvent` copies `data` onto the event, so a `preventDefault` in it is what
 * the listener calls.
 */
async function offer(
  host: TestElement,
  name: string,
  data: Record<string, number | { getData: () => string }>,
): Promise<boolean> {
  let blocked = false;
  await host.dispatchEvent(name, {
    ...data,
    preventDefault: () => {
      blocked = true;
    },
  });
  return blocked;
}
