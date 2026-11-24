import { ComponentHarness, type TestElement } from '@angular/cdk/testing';
import type { WjSplitterOrientation } from 'weeljack-ng/splitter';
import { WjSplitterPanelHarness } from './splitter-panel-harness';

/**
 * Test harness for `wj-splitter`. Describes the splitter as a user meets it: which way it runs, its
 * panels and their sizes, and its gutters, each the one `separator` that takes focus and the keys.
 * A gutter is named by its position: 0 is the one between the first and second panel. With three
 * or more panels Optimus gives every gutter one value, the last-resized one.
 *
 * Optimus acts on a key 40 ms after the press and reports a size on key-up, so a spec polls a
 * value here after a key. `getPanels()` also finds the panels of a splitter nested in a panel.
 */
export class WjSplitterHarness extends ComponentHarness {
  static hostSelector = 'wj-splitter';

  private readonly root = this.locatorFor('[data-pc-section="root"]');
  private readonly gutters = this.locatorForAll('[role="separator"]');

  /** Whether the panels sit side by side (`horizontal`) or stacked (`vertical`). */
  async getOrientation(): Promise<WjSplitterOrientation> {
    const direction = await (await this.root()).getCssValue('flex-direction');
    return direction === 'column' ? 'vertical' : 'horizontal';
  }

  /** The panels, in order. */
  async getPanels(): Promise<WjSplitterPanelHarness[]> {
    return this.locatorForAll(WjSplitterPanelHarness)();
  }

  /**
   * Each panel's share of the panels' total length along the splitter, in percent, measured from
   * the boxes. It adds up to 100 and is within a pixel's share of the `size` that was set.
   */
  async getPanelSizes(): Promise<number[]> {
    const horizontal = (await this.getOrientation()) === 'horizontal';
    const lengths = await Promise.all(
      (await this.getPanels()).map(async (panel) => {
        const { width, height } = await panel.getSize();
        return horizontal ? width : height;
      }),
    );
    const total = lengths.reduce((sum, length) => sum + length, 0);
    return lengths.map((length) => (100 * length) / total);
  }

  /** How many gutters there are: one fewer than the panels. */
  async getGutterCount(): Promise<number> {
    return (await this.gutters()).length;
  }

  /** The gutter's `aria-valuenow`, as a number; `null` when it has none. */
  async getGutterValue(index = 0): Promise<number | null> {
    const value = await this.attribute(index, 'aria-valuenow');
    return value === null ? null : Number(value);
  }

  /** The gutter's `aria-valuemin`; `null` when it has none. */
  async getGutterMin(index = 0): Promise<string | null> {
    return this.attribute(index, 'aria-valuemin');
  }

  /** The gutter's `aria-valuemax`; `null` when it has none. */
  async getGutterMax(index = 0): Promise<string | null> {
    return this.attribute(index, 'aria-valuemax');
  }

  /** The gutter's `aria-orientation`: the direction the line runs, not the panels'. */
  async getGutterOrientation(index = 0): Promise<string | null> {
    return this.attribute(index, 'aria-orientation');
  }

  /** The gutter's `aria-label`; `null` when it has none. */
  async getGutterLabel(index = 0): Promise<string | null> {
    return this.attribute(index, 'aria-label');
  }

  /** The gutter's `aria-labelledby`; `null` when it has none. */
  async getGutterLabelledBy(index = 0): Promise<string | null> {
    return this.attribute(index, 'aria-labelledby');
  }

  /** The gutter's `aria-describedby`; `null` when it has none. */
  async getGutterDescribedBy(index = 0): Promise<string | null> {
    return this.attribute(index, 'aria-describedby');
  }

  /** Moves focus to the gutter. */
  async focusGutter(index = 0): Promise<void> {
    await (await this.gutter(index)).focus();
  }

  /** Whether the gutter has focus. */
  async isGutterFocused(index = 0): Promise<boolean> {
    return (await this.gutter(index)).isFocused();
  }

  private async gutter(index: number): Promise<TestElement> {
    const gutter = (await this.gutters())[index];
    if (gutter === undefined) {
      throw new Error(`wj-splitter has no gutter at index ${String(index)}`);
    }
    return gutter;
  }

  private async attribute(index: number, name: string): Promise<string | null> {
    return (await this.gutter(index)).getAttribute(name);
  }
}
