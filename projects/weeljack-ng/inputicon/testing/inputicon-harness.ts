import { ComponentHarness } from '@angular/cdk/testing';

/**
 * Test harness for `wj-inputicon`. An input icon is not a control: read what it shows and whether
 * assistive technology skips it.
 */
export class WjInputIconHarness extends ComponentHarness {
  static hostSelector = 'wj-inputicon';

  /** The text the icon holds: empty for an SVG icon, the glyph for a ligature or text icon. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Whether the icon is hidden from assistive technology: `aria-hidden="true"` on the host or on
   * the icon you projected (the first element inside it).
   */
  async isHiddenFromAt(): Promise<boolean> {
    const host = await this.host();
    if ((await host.getAttribute('aria-hidden')) === 'true') {
      return true;
    }
    const icon = await this.locatorForOptional('p-inputicon > *')();
    return icon !== null && (await icon.getAttribute('aria-hidden')) === 'true';
  }
}
