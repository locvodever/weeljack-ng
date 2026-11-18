import {
  ComponentHarness,
  HarnessPredicate,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/** Criteria for finding a `wj-image` with {@link WjImageHarness.with}. */
export interface WjImageHarnessFilters extends BaseHarnessFilters {
  /** The image URL, as a string for an exact match or a RegExp. */
  src?: string | RegExp;
  /** The text alternative, as a string for an exact match or a RegExp. */
  alt?: string | RegExp;
  /** Whether the image offers a preview. */
  preview?: boolean;
}

/**
 * Test harness for `wj-image`. Describes the image as a user meets it: its URL and text alternative,
 * whether it offers a preview, and the preview itself (open, rotate, zoom, close). The preview
 * renders inside the host, so everything is found from the image.
 */
export class WjImageHarness extends ComponentHarness {
  static hostSelector = 'wj-image';

  // Direct children of `p-image`: the enlarged image inside the preview is not one of them.
  private readonly photo = this.locatorFor('p-image > img');
  private readonly enlarge = this.locatorForOptional('p-image > button');
  private readonly dialog = this.locatorForOptional('[role="dialog"]');

  /** Finds the images that match `options`. */
  static with(options: WjImageHarnessFilters = {}): HarnessPredicate<WjImageHarness> {
    return new HarnessPredicate(WjImageHarness, options)
      .addOption('src', options.src, async (harness, src) =>
        HarnessPredicate.stringMatches(await harness.getSourceUrl(), src),
      )
      .addOption('alt', options.alt, async (harness, alt) =>
        HarnessPredicate.stringMatches(await harness.getAlt(), alt),
      )
      .addOption(
        'preview',
        options.preview,
        async (harness, preview) => (await harness.hasPreview()) === preview,
      );
  }

  /** The URL of the image; `null` when it has none. */
  async getSourceUrl(): Promise<string | null> {
    return (await this.photo()).getAttribute('src');
  }

  /** The text alternative (`''` when decorative). */
  async getAlt(): Promise<string> {
    return (await (await this.photo()).getAttribute('alt')) ?? '';
  }

  /** Whether the image offers a preview: it has an enlarge button. */
  async hasPreview(): Promise<boolean> {
    return (await this.enlarge()) !== null;
  }

  /** Whether the preview is open. A preview that is closing already counts as closed. */
  async isPreviewOpen(): Promise<boolean> {
    const dialog = await this.dialog();
    return dialog ? (await dialog.getAttribute('aria-modal')) === 'true' : false;
  }

  /** Clicks the enlarge button. Throws when the image offers no preview. */
  async openPreview(): Promise<void> {
    const button = await this.enlarge();
    if (!button) {
      throw new Error('wj-image: the image offers no preview, so it has no enlarge button');
    }
    await button.click();
  }

  /** Rotates the enlarged image a quarter turn to the left. Throws when the preview is closed. */
  async rotateLeft(): Promise<void> {
    await (await this.action('rotateleftbutton')).click();
  }

  /** Rotates the enlarged image a quarter turn to the right. Throws when the preview is closed. */
  async rotateRight(): Promise<void> {
    await (await this.action('rotaterightbutton')).click();
  }

  /** Zooms the enlarged image in a step. Throws when the preview is closed. */
  async zoomIn(): Promise<void> {
    await (await this.action('zoominbutton')).click();
  }

  /** Zooms the enlarged image out a step. Throws when the preview is closed. */
  async zoomOut(): Promise<void> {
    await (await this.action('zoomoutbutton')).click();
  }

  /** Clicks the Close button of the preview. Throws when the preview is closed. */
  async closePreview(): Promise<void> {
    await (await this.action('closebutton')).click();
  }

  private async action(part: string): Promise<TestElement> {
    const button = await this.locatorForOptional(`[data-pc-section="${part}"]`)();
    if (!button) {
      throw new Error('wj-image: the preview is closed, so it has no toolbar');
    }
    return button;
  }
}
