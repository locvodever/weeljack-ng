import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-orderlist` with {@link WjOrderListHarness.with}. */
export interface WjOrderListHarnessFilters extends BaseHarnessFilters {
  /**
   * The list's name, as a string for an exact match or a RegExp: its `ariaLabel`, or the text of
   * the element its `ariaLabelledBy` points at.
   */
  name?: string | RegExp;
}

/**
 * Test harness for `wj-orderlist`. Describes the list as a user meets it: the items in their
 * order, the selection, the move buttons and the filter.
 */
export class WjOrderListHarness extends ComponentHarness {
  static hostSelector = 'wj-orderlist';

  private readonly list = this.locatorFor('[role="listbox"]');
  private readonly items = this.locatorForAll('[role="option"]');
  private readonly buttons = this.locatorForAll('.p-orderlist-controls button');
  private readonly filterInput = this.locatorForOptional('.p-listbox-header input');

  /** Finds the lists whose name matches `options.name`. */
  static with(options: WjOrderListHarnessFilters = {}): HarnessPredicate<WjOrderListHarness> {
    return new HarnessPredicate(WjOrderListHarness, options).addOption(
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
    const list = await this.list();
    const label = await list.getAttribute('aria-label');
    if (label !== null) {
      return label;
    }
    const labelledBy = await list.getAttribute('aria-labelledby');
    if (labelledBy === null) {
      return '';
    }
    const named = await this.documentRootLocatorFactory().locatorForOptional(`#${labelledBy}`)();
    return named === null ? '' : named.text();
  }

  /** The text of each item the list shows, in order. A filter hides the items it does not match. */
  async getItemTexts(): Promise<string[]> {
    const texts: string[] = [];
    for (const item of await this.items()) {
      texts.push((await item.text()).trim());
    }
    return texts;
  }

  /** The text of each selected item, in the order the list shows them. */
  async getSelectedItemTexts(): Promise<string[]> {
    const texts: string[] = [];
    for (const item of await this.items()) {
      if ((await item.getAttribute('aria-selected')) === 'true') {
        texts.push((await item.text()).trim());
      }
    }
    return texts;
  }

  /**
   * Toggles the item with this text (a string, or a RegExp), or at this index among the items
   * shown, as a click does: a selected item becomes unselected.
   */
  async selectItem(textOrIndex: string | RegExp | number): Promise<void> {
    const items = await this.items();
    if (typeof textOrIndex === 'number') {
      const item = items[textOrIndex];
      if (item === undefined) {
        throw new Error(`wj-orderlist has no item at index ${String(textOrIndex)}`);
      }
      return item.click();
    }
    for (const item of items) {
      if (await HarnessPredicate.stringMatches((await item.text()).trim(), textOrIndex)) {
        return item.click();
      }
    }
    throw new Error(`wj-orderlist has no item with the text ${String(textOrIndex)}`);
  }

  /** Moves the selected items one place up, with the "Move up" button. */
  async moveUp(): Promise<void> {
    await this.press(0);
  }

  /** Moves the selected items to the top, with the "Move top" button. */
  async moveTop(): Promise<void> {
    await this.press(1);
  }

  /** Moves the selected items one place down, with the "Move down" button. */
  async moveDown(): Promise<void> {
    await this.press(2);
  }

  /** Moves the selected items to the bottom, with the "Move bottom" button. */
  async moveBottom(): Promise<void> {
    await this.press(3);
  }

  /** Types `text` into the filter input, so the list shows only the items that match. */
  async filter(text: string): Promise<void> {
    const input = await this.filterInput();
    if (input === null) {
      throw new Error('wj-orderlist has no filter input: is filterBy set?');
    }
    await input.setInputValue(text);
    await input.dispatchEvent('input');
  }

  /** Whether the list is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.list()).getAttribute('aria-disabled')) === 'true';
  }

  private async press(position: number): Promise<void> {
    const button = (await this.buttons())[position];
    if (button === undefined) {
      throw new Error('wj-orderlist has no move buttons');
    }
    await button.click();
  }
}
