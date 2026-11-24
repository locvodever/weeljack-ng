import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-treeselect` with {@link WjTreeSelectHarness.with}. */
export interface WjTreeSelectHarnessFilters extends BaseHarnessFilters {
  /** The combobox's `aria-label`, as a string for an exact match or a RegExp. */
  ariaLabel?: string | RegExp;
  /**
   * The text the closed control shows (the picked labels, comma-separated, or the placeholder; an
   * empty string when there is neither), string or RegExp.
   */
  valueText?: string | RegExp;
}

/** One node of the open panel, the way a user meets it. Private to this harness. */
class PanelNodeHarness extends ComponentHarness {
  static hostSelector = '[role="treeitem"]';

  private readonly content = this.locatorFor('[data-pc-section="nodecontent"]');
  private readonly toggle = this.locatorFor('[data-pc-section="nodetogglebutton"]');

  async getText(): Promise<string> {
    return (await (await this.content()).text()).trim();
  }

  async isExpandable(): Promise<boolean> {
    return (await (await this.toggle()).getCssValue('visibility')) !== 'hidden';
  }

  async isExpanded(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  async isChecked(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-checked')) === 'true';
  }

  async expand(): Promise<void> {
    if ((await this.isExpandable()) && !(await this.isExpanded())) {
      await (await this.toggle()).click();
    }
  }

  async click(): Promise<void> {
    await (await this.content()).click();
  }

  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}

/**
 * Test harness for `wj-treeselect`. Describes the control as a user meets it: the text it shows, its
 * panel of nodes, and its ARIA state. The panel is found through the combobox's `aria-controls`, so
 * it works wherever Optimus attaches the overlay. It never names an Optimus class.
 */
export class WjTreeSelectHarness extends ComponentHarness {
  static hostSelector = 'wj-treeselect';

  private readonly control = this.locatorFor('[role="combobox"]');
  private readonly label = this.locatorFor('[data-pc-section="label"]');

  /** Finds the tree selects that match `options`. */
  static with(options: WjTreeSelectHarnessFilters = {}): HarnessPredicate<WjTreeSelectHarness> {
    return new HarnessPredicate(WjTreeSelectHarness, options)
      .addOption('ariaLabel', options.ariaLabel, async (harness, ariaLabel) =>
        HarnessPredicate.stringMatches(await harness.getAriaLabel(), ariaLabel),
      )
      .addOption('valueText', options.valueText, async (harness, valueText) =>
        HarnessPredicate.stringMatches(await harness.getValueText(), valueText),
      );
  }

  /**
   * The text the closed control shows: the picked labels, comma-separated, else the placeholder,
   * else an empty string (Optimus shows a hidden "empty" there).
   */
  async getValueText(): Promise<string> {
    const label = await this.label();
    if ((await label.getCssValue('visibility')) === 'hidden') {
      return '';
    }
    return (await label.text()).replaceAll(' ', '').trim();
  }

  /** Whether the panel is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-expanded')) === 'true';
  }

  /**
   * Opens the panel with a click, as a user does. Does nothing when it is open.
   *
   * It resolves when the click is done, not when the panel's enter motion has ended. Optimus undoes
   * a pick made in that first moment (the panel shows itself again), so a spec that picks a node
   * waits for the panel to finish opening first, as a user would.
   */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.control()).click();
    }
  }

  /**
   * Closes the panel with a click on the control, as a user does. Does nothing when it is closed.
   * Optimus reads `KeyboardEvent.code` for Escape, which a test harness's key events do not set, so
   * a keyboard spec presses Escape through a real keyboard instead.
   */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      await (await this.control()).click();
    }
  }

  /** The text of the nodes on screen in the panel, in order. Opens it to read them. */
  async getNodeTexts(): Promise<string[]> {
    const texts: string[] = [];
    for (const node of await this.nodes()) {
      texts.push(await node.getText());
    }
    return texts;
  }

  /** Opens the node with this text. Opens the panel first; does nothing for a leaf. */
  async expandNode(text: string): Promise<void> {
    await (await this.node(text)).expand();
  }

  /** Clicks the node with this text: picks it (single mode closes the panel), or unpicks it. */
  async selectNode(text: string): Promise<void> {
    await (await this.node(text)).click();
  }

  /** Checks the node with this text in checkbox mode. Does nothing when it is checked. */
  async checkNode(text: string): Promise<void> {
    const node = await this.node(text);
    if (!(await node.isChecked())) {
      await node.click();
    }
  }

  /** Whether the control cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }

  /** Whether the control is required. */
  async isRequired(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the control shows the invalid state (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-invalid')) === 'true';
  }

  /** The `id` of the combobox, or an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.control()).getAttribute('id')) ?? '';
  }

  /** The combobox's `aria-label`, `null` when absent. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.control()).getAttribute('aria-label');
  }

  /** The combobox's `aria-labelledby`, `null` when absent. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.control()).getAttribute('aria-labelledby');
  }

  /** The combobox's `aria-describedby`, `null` when absent. */
  async getAriaDescribedBy(): Promise<string | null> {
    return (await this.control()).getAttribute('aria-describedby');
  }

  /** Moves focus to the combobox. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Removes focus from the combobox. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Whether the combobox has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.control()).isFocused();
  }

  /** The nodes of the open panel, in order. Opens the panel. */
  private async nodes(): Promise<PanelNodeHarness[]> {
    await this.open();
    const id = await (await this.control()).getAttribute('aria-controls');
    return this.documentRootLocatorFactory().locatorForAll(
      new HarnessPredicate(PanelNodeHarness, { ancestor: `[id="${id ?? ''}"]` }),
    )();
  }

  private async node(text: string): Promise<PanelNodeHarness> {
    for (const node of await this.nodes()) {
      if ((await node.getText()) === text) {
        return node;
      }
    }
    throw new Error(`wj-treeselect has no node labelled "${text}" on screen.`);
  }
}
