import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { WjAvatarShape, WjAvatarSize } from 'weeljack-ng/avatar';

/** Criteria for finding a `wj-avatar` with {@link WjAvatarHarness.with}. */
export interface WjAvatarHarnessFilters extends BaseHarnessFilters {
  /** The visible label (the initials), as a string for an exact match or a RegExp. */
  label?: string | RegExp;
}

/**
 * Test harness for `wj-avatar`. Describes the avatar as a user meets it: the initials, the photo,
 * whether the avatar is named and by what, its size and its shape.
 */
export class WjAvatarHarness extends ComponentHarness {
  static hostSelector = 'wj-avatar';

  private readonly root = this.locatorFor('p-avatar');
  private readonly labelPart = this.locatorForOptional('[data-pc-section="label"]');
  private readonly photo = this.locatorForOptional('img');

  /** Finds the avatars whose visible label matches `options.label`. */
  static with(options: WjAvatarHarnessFilters = {}): HarnessPredicate<WjAvatarHarness> {
    return new HarnessPredicate(WjAvatarHarness, options).addOption(
      'label',
      options.label,
      async (harness, label) => HarnessPredicate.stringMatches(await harness.getLabel(), label),
    );
  }

  /** The visible label (the initials), trimmed; `null` when the avatar shows none. */
  async getLabel(): Promise<string | null> {
    const label = await this.labelPart();
    return label ? (await label.text()).trim() : null;
  }

  /** The URL of the photo; `null` when the avatar shows none. */
  async getImageUrl(): Promise<string | null> {
    const photo = await this.photo();
    return photo ? photo.getAttribute('src') : null;
  }

  /** The `aria-label` that names the avatar; `null` when it has none. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.root()).getAttribute('aria-label');
  }

  /** The ids in `aria-labelledby` that name the avatar; `null` when it has none. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.root()).getAttribute('aria-labelledby');
  }

  /** Whether the avatar is named: it then reads as one image. */
  async isNamed(): Promise<boolean> {
    return (await this.root()).matchesSelector('[role="img"]');
  }

  /** Whether the avatar is decorative: it is not named, and its photo has an empty `alt`. */
  async isDecorative(): Promise<boolean> {
    return !(await this.isNamed());
  }

  /** `large` or `xlarge`; `null` for the default size. */
  async getSize(): Promise<WjAvatarSize | null> {
    const size = await (await this.host()).getAttribute('data-wj-size');
    return size === 'large' || size === 'xlarge' ? size : null;
  }

  /** `square` or `circle`. */
  async getShape(): Promise<WjAvatarShape> {
    return (await (await this.host()).getAttribute('data-wj-shape')) === 'circle'
      ? 'circle'
      : 'square';
  }
}
