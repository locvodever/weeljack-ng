import { ComponentHarness, HarnessPredicate, type TestElement } from '@angular/cdk/testing';

/**
 * Test harness for `wj-picklist`. Describes the pick list as a user meets it: the items of each
 * list in their order, the selection, the four transfer buttons and the two filters.
 */
export class WjPickListHarness extends ComponentHarness {
  static hostSelector = 'wj-picklist';

  private readonly sourceItems = this.locatorForAll(
    '.p-picklist-source-list-container [role="option"]',
  );
  private readonly targetItems = this.locatorForAll(
    '.p-picklist-target-list-container [role="option"]',
  );
  private readonly transfers = this.locatorForAll('.p-picklist-transfer-controls button');
  private readonly sourceFilter = this.locatorForOptional(
    '.p-picklist-source-list-container .p-listbox-header input',
  );
  private readonly targetFilter = this.locatorForOptional(
    '.p-picklist-target-list-container .p-listbox-header input',
  );
  private readonly lists = this.locatorForAll('[role="listbox"]');

  /** The text of each item the source list shows, in order. A filter hides the items it does not match. */
  async getSourceItemTexts(): Promise<string[]> {
    return texts(await this.sourceItems());
  }

  /** The text of each item the target list shows, in order. A filter hides the items it does not match. */
  async getTargetItemTexts(): Promise<string[]> {
    return texts(await this.targetItems());
  }

  /**
   * Toggles the source item with this text (a string, or a RegExp), or at this index among the
   * items shown, as a click does: a selected item becomes unselected.
   */
  async selectSourceItem(textOrIndex: string | RegExp | number): Promise<void> {
    await toggle(await this.sourceItems(), textOrIndex, 'source');
  }

  /** Toggles the target item with this text, or at this index, as {@link selectSourceItem} does. */
  async selectTargetItem(textOrIndex: string | RegExp | number): Promise<void> {
    await toggle(await this.targetItems(), textOrIndex, 'target');
  }

  /** Moves the selected source items to the target list, with the "Move to Target" button. */
  async moveToTarget(): Promise<void> {
    await this.press(0);
  }

  /** Moves every source item the filter shows to the target list, with the "Move All to Target" button. */
  async moveAllToTarget(): Promise<void> {
    await this.press(1);
  }

  /** Moves the selected target items to the source list, with the "Move to Source" button. */
  async moveToSource(): Promise<void> {
    await this.press(2);
  }

  /** Moves every target item the filter shows to the source list, with the "Move All to Source" button. */
  async moveAllToSource(): Promise<void> {
    await this.press(3);
  }

  /** Types `text` into the source filter, so the list shows only the items that match. */
  async filterSource(text: string): Promise<void> {
    await type(await this.sourceFilter(), text, 'source');
  }

  /** Types `text` into the target filter, so the list shows only the items that match. */
  async filterTarget(text: string): Promise<void> {
    await type(await this.targetFilter(), text, 'target');
  }

  /** Whether the lists are disabled. */
  async isDisabled(): Promise<boolean> {
    const lists = await this.lists();
    const states = await Promise.all(lists.map((list) => list.getAttribute('aria-disabled')));
    return states.length > 0 && states.every((state) => state === 'true');
  }

  private async press(position: number): Promise<void> {
    const button = (await this.transfers())[position];
    if (button === undefined) {
      throw new Error('wj-picklist has no transfer buttons');
    }
    await button.click();
  }
}

async function texts(items: TestElement[]): Promise<string[]> {
  return Promise.all(items.map(async (item) => (await item.text()).trim()));
}

async function toggle(
  items: TestElement[],
  textOrIndex: string | RegExp | number,
  list: string,
): Promise<void> {
  if (typeof textOrIndex === 'number') {
    const item = items[textOrIndex];
    if (item === undefined) {
      throw new Error(`wj-picklist has no ${list} item at index ${String(textOrIndex)}`);
    }
    return item.click();
  }
  for (const item of items) {
    if (await HarnessPredicate.stringMatches((await item.text()).trim(), textOrIndex)) {
      return item.click();
    }
  }
  throw new Error(`wj-picklist has no ${list} item with the text ${String(textOrIndex)}`);
}

async function type(input: TestElement | null, text: string, list: string): Promise<void> {
  if (input === null) {
    throw new Error(`wj-picklist has no ${list} filter input: is filterBy set?`);
  }
  await input.setInputValue(text);
  await input.dispatchEvent('input');
}
