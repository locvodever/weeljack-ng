import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
} from '@angular/cdk/testing';

/** Where a `wj-drawer` opens from. */
export type WjDrawerHarnessPosition = 'left' | 'right' | 'top' | 'bottom';

/** Criteria for finding a `wj-drawer` with {@link WjDrawerHarness.with}. */
export interface WjDrawerHarnessFilters extends BaseHarnessFilters {
  /** The title, as a string for an exact match or a RegExp. Only an open drawer has one. */
  title?: string | RegExp;
}

const POSITIONS: readonly WjDrawerHarnessPosition[] = ['left', 'right', 'top', 'bottom'];

/**
 * Test harness for `wj-drawer`. Describes the drawer as a user meets it. The body and the footer
 * are inside it, so `getHarness(WjButtonHarness.with({ label: 'Apply' }))` reaches the actions. A
 * closed drawer renders nothing, so everything but {@link isOpen} throws until it opens.
 */
export class WjDrawerHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-drawer';

  private readonly drawer = this.locatorFor('[role="dialog"]');
  private readonly maybeDrawer = this.locatorForOptional('[role="dialog"]');
  private readonly title = this.locatorFor('[data-pc-section="title"]');
  private readonly closeButton = this.locatorForOptional('[data-pc-section="header"] button');
  // The backdrop is appended to the document body, outside the host.
  private readonly backdrop =
    this.documentRootLocatorFactory().locatorForOptional('.p-drawer-mask');

  /** Finds the drawers that match `options`. */
  static with(options: WjDrawerHarnessFilters = {}): HarnessPredicate<WjDrawerHarness> {
    return new HarnessPredicate(WjDrawerHarness, options).addOption(
      'title',
      options.title,
      async (harness, title) =>
        HarnessPredicate.stringMatches(
          (await harness.isOpen()) ? await harness.getTitle() : null,
          title,
        ),
    );
  }

  /** Whether the drawer is on the page. A drawer that is leaving still counts as open. */
  async isOpen(): Promise<boolean> {
    return (await this.maybeDrawer()) !== null;
  }

  /** The title text. */
  async getTitle(): Promise<string> {
    return (await (await this.title()).text()).trim();
  }

  /** The element's role: `dialog`. */
  async getRole(): Promise<string | null> {
    return (await this.drawer()).getAttribute('role');
  }

  /** Whether the drawer tells assistive technology that the page behind it is inert. */
  async isModal(): Promise<boolean> {
    return (await (await this.drawer()).getAttribute('aria-modal')) === 'true';
  }

  /** The edge the drawer opens from. */
  async getPosition(): Promise<WjDrawerHarnessPosition> {
    const drawer = await this.drawer();
    for (const position of POSITIONS) {
      if (await drawer.hasClass(`p-drawer-${position}`)) {
        return position;
      }
    }
    throw new Error('wj-drawer has no known position');
  }

  /** The text of the element that describes the drawer, `null` without `ariaDescribedBy`. */
  async getDescription(): Promise<string | null> {
    const id = await (await this.drawer()).getAttribute('aria-describedby');
    if (id === null) {
      return null;
    }
    const description = await this.documentRootLocatorFactory().locatorForOptional(
      `#${CSS.escape(id)}`,
    )();
    return (await description?.text())?.trim() ?? null;
  }

  /** Whether the drawer has a close button (it has none while `closable` is false). */
  async hasCloseButton(): Promise<boolean> {
    return (await this.closeButton()) !== null;
  }

  /** The close button's accessible name, `null` when there is no button. */
  async getCloseLabel(): Promise<string | null> {
    return (await (await this.closeButton())?.getAttribute('aria-label')) ?? null;
  }

  /** Clicks the close button. Throws when there is none. */
  async close(): Promise<void> {
    const button = await this.closeButton();
    if (button === null) {
      throw new Error('wj-drawer has no close button: it is not closable, or it is closed');
    }
    await button.click();
  }

  /** Presses Escape on the drawer, as a user does. It closes the drawer only while closable. */
  async closeWithEscape(): Promise<void> {
    await (await this.drawer()).sendKeys(TestKey.ESCAPE);
  }

  /** Whether the page behind the drawer has a backdrop over it. */
  async hasBackdrop(): Promise<boolean> {
    return (await this.backdrop()) !== null;
  }

  /** Clicks the backdrop. It closes the drawer only while closable. Throws without a backdrop. */
  async clickBackdrop(): Promise<void> {
    const backdrop = await this.backdrop();
    if (backdrop === null) {
      throw new Error('wj-drawer has no backdrop: it is closed');
    }
    await backdrop.click();
  }

  /** Whether focus is on the drawer or inside it. */
  async containsFocus(): Promise<boolean> {
    return (await this.drawer()).matchesSelector(':focus-within');
  }
}
