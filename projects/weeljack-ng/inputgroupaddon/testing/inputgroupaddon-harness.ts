import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-inputgroupaddon` with {@link WjInputGroupAddonHarness.with}. */
export interface WjInputGroupAddonHarnessFilters extends BaseHarnessFilters {
  /** The addon's text, as a string for an exact match or a RegExp. */
  text?: string | RegExp;
}

/**
 * Test harness for `wj-inputgroupaddon`. Reach a `wj-button` inside it with the inherited
 * `getHarness`, for example `addon.getHarness(WjButtonHarness)`.
 */
export class WjInputGroupAddonHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-inputgroupaddon';

  /** Finds the addons whose text matches `options.text`. */
  static with(
    options: WjInputGroupAddonHarnessFilters = {},
  ): HarnessPredicate<WjInputGroupAddonHarness> {
    return new HarnessPredicate(WjInputGroupAddonHarness, options).addOption(
      'text',
      options.text,
      (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** The addon's text, trimmed. A button addon reports its button's label. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }
}
