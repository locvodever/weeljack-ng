import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/** Criteria for finding a `wj-rating` with {@link WjRatingHarness.with}. */
export interface WjRatingHarnessFilters extends BaseHarnessFilters {
  /** The number of stars picked, `null` for none. */
  value?: number | null;
}

/**
 * Test harness for `wj-rating`. Describes the rating as a user meets it: the stars picked, a click
 * on a star, its disabled, read-only and invalid states and the group's ARIA attributes. It never
 * names an Optimus class.
 */
export class WjRatingHarness extends ComponentHarness {
  static hostSelector = 'wj-rating';

  private readonly group = this.locatorFor('[role="radiogroup"]');
  /** Each star's native radio, in order: where state and focus live. */
  private readonly radios = this.locatorForAll('input[type="radio"]');
  /** Each star's glyph, in order: what a user clicks. */
  private readonly glyphs = this.locatorForAll('svg');

  /** Finds the ratings that match `options`. */
  static with(options: WjRatingHarnessFilters = {}): HarnessPredicate<WjRatingHarness> {
    return new HarnessPredicate(WjRatingHarness, options).addOption(
      'value',
      options.value,
      async (harness, value) => (await harness.getValue()) === value,
    );
  }

  /** The number of stars picked, `null` while none is. */
  async getValue(): Promise<number | null> {
    const radios = await this.radios();
    for (const [index, radio] of radios.entries()) {
      if (await radio.getProperty<boolean>('checked')) {
        return index + 1;
      }
    }
    return null;
  }

  /** How many stars the row has. */
  async getStarCount(): Promise<number> {
    return (await this.radios()).length;
  }

  /** Each star's accessible label, in order ("1 star", "2 stars", …). */
  async getStarLabels(): Promise<string[]> {
    return Promise.all(
      (await this.radios()).map(async (radio) => (await radio.getAttribute('aria-label')) ?? ''),
    );
  }

  /** Clicks the `count`th star (1-based), which rates that many; the current star clears. */
  async rate(count: number): Promise<void> {
    const glyph = (await this.glyphs())[count - 1];
    if (glyph === undefined) {
      throw new Error(`The rating has no star ${String(count)}.`);
    }
    await glyph.click();
  }

  /** Clears the rating: clicks the current star, and does nothing while none is picked. */
  async clear(): Promise<void> {
    const value = await this.getValue();
    if (value !== null) {
      await this.rate(value);
    }
  }

  /** Whether the rating cannot be changed or focused. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.radios())[0]?.getProperty<boolean>('disabled')) ?? false;
  }

  /** Whether the rating shows its value but cannot change it (`aria-readonly="true"`). */
  async isReadonly(): Promise<boolean> {
    return (await (await this.group()).getAttribute('aria-readonly')) === 'true';
  }

  /** Whether the group is marked invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.group()).getAttribute('aria-invalid')) === 'true';
  }

  /** Whether the group is marked required (`aria-required="true"`). */
  async isRequired(): Promise<boolean> {
    return (await (await this.group()).getAttribute('aria-required')) === 'true';
  }

  /** The group's id, an empty string when it has none. */
  async getId(): Promise<string> {
    return (await (await this.group()).getProperty<string>('id')) || '';
  }

  /** The ARIA name and description attributes as set on the group, `null` when absent. */
  async getAriaAttributes(): Promise<{
    label: string | null;
    labelledBy: string | null;
    describedBy: string | null;
  }> {
    const group = await this.group();
    return {
      label: await group.getAttribute('aria-label'),
      labelledBy: await group.getAttribute('aria-labelledby'),
      describedBy: await group.getAttribute('aria-describedby'),
    };
  }

  /** Moves focus into the rating: onto the checked star, else the first. */
  async focus(): Promise<void> {
    await (await this.entryStar())?.focus();
  }

  /** Removes focus from the rating. */
  async blur(): Promise<void> {
    for (const radio of await this.radios()) {
      if (await radio.isFocused()) {
        await radio.blur();
      }
    }
  }

  /** Whether a star of the rating has focus. */
  async isFocused(): Promise<boolean> {
    for (const radio of await this.radios()) {
      if (await radio.isFocused()) {
        return true;
      }
    }
    return false;
  }

  /** The star Tab enters at: the checked one, else the first. */
  private async entryStar(): Promise<Awaited<ReturnType<typeof this.radios>>[number] | undefined> {
    const radios = await this.radios();
    for (const radio of radios) {
      if (await radio.getProperty<boolean>('checked')) {
        return radio;
      }
    }
    return radios[0];
  }
}
