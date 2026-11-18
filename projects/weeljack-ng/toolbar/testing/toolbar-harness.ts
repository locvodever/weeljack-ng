import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/**
 * Test harness for `wj-toolbar`. Reads the text of each section and the toolbar's ARIA name
 * attributes, from the `role="toolbar"` element and Optimus's `data-pc-section` hooks, never from a
 * class name.
 */
export class WjToolbarHarness extends ComponentHarness {
  static hostSelector = 'wj-toolbar';

  private readonly toolbar = this.locatorFor('[role="toolbar"]');
  private readonly start = this.locatorForOptional('[data-pc-section="start"]');
  private readonly center = this.locatorForOptional('[data-pc-section="center"]');
  private readonly end = this.locatorForOptional('[data-pc-section="end"]');

  /** The text of the start section, trimmed; `null` when the toolbar has no start section. */
  async getStartText(): Promise<string | null> {
    return this.textOf(await this.start());
  }

  /** The text of the center section, trimmed; `null` when the toolbar has no center section. */
  async getCenterText(): Promise<string | null> {
    return this.textOf(await this.center());
  }

  /** The text of the end section, trimmed; `null` when the toolbar has no end section. */
  async getEndText(): Promise<string | null> {
    return this.textOf(await this.end());
  }

  /** The toolbar's `aria-label`; `null` when it has none. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.toolbar()).getAttribute('aria-label');
  }

  /** The toolbar's `aria-labelledby`; `null` when it has none. */
  async getAriaLabelledBy(): Promise<string | null> {
    return (await this.toolbar()).getAttribute('aria-labelledby');
  }

  private async textOf(section: TestElement | null): Promise<string | null> {
    return section === null ? null : (await section.text()).trim();
  }
}
