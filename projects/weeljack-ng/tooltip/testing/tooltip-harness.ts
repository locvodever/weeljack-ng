import { ComponentHarness, TestKey, type TestElement } from '@angular/cdk/testing';
import type { WjTooltipPosition } from 'weeljack-ng/tooltip';

/** The bubble renders in `document.body`, so it is found from the document root. */
const BUBBLE = '[role="tooltip"]';

/**
 * Test harness for `[wjTooltip]`. Describes the tooltip as a user meets it: hover or focus shows
 * it, blur, pointer leave and Escape hide it. The bubble is in `document.body`, so it is found
 * from the document root: with one tooltip showing, the bubble it finds is that host's. The
 * element's focus and its `aria-describedby` are looked up on the focusable part, which is the
 * host itself or, on a component such as `wj-button`, the control inside it.
 */
export class WjTooltipHarness extends ComponentHarness {
  static hostSelector = '[wjTooltip]';

  private readonly control = async (): Promise<TestElement> =>
    (await this.locatorForOptional('.p-component')()) ?? this.host();

  private readonly bubble = this.documentRootLocatorFactory().locatorFor(BUBBLE);
  private readonly maybeBubble = this.documentRootLocatorFactory().locatorForOptional(BUBBLE);

  /** Moves the pointer onto the host. */
  async hover(): Promise<void> {
    await (await this.host()).hover();
  }

  /** Moves the pointer off the host. */
  async unhover(): Promise<void> {
    await (await this.host()).mouseAway();
  }

  /** Moves keyboard focus to the host's focusable part. */
  async focus(): Promise<void> {
    await (await this.control()).focus();
  }

  /** Takes focus off the host's focusable part. */
  async blur(): Promise<void> {
    await (await this.control()).blur();
  }

  /** Presses Escape: the bubble hides and focus stays where it was. */
  async dismiss(): Promise<void> {
    await (await this.control()).sendKeys(TestKey.ESCAPE);
  }

  /** Whether the bubble is on the page. */
  async isShown(): Promise<boolean> {
    return (await this.maybeBubble()) !== null;
  }

  /** The bubble's text. Throws while it is not shown. */
  async getText(): Promise<string> {
    return (await this.bubble()).text();
  }

  /**
   * The text of the description the host references, shown or not: what a screen reader speaks
   * when focus reaches the element. `null` when nothing is referenced.
   */
  async getDescription(): Promise<string | null> {
    const ids = ((await (await this.control()).getAttribute('aria-describedby')) ?? '')
      .split(/\s+/)
      .filter(Boolean);
    const texts: string[] = [];
    for (const id of ids) {
      const element = await this.documentRootLocatorFactory().locatorForOptional(
        `#${CSS.escape(id)}`,
      )();
      texts.push((await element?.text()) ?? '');
    }
    return ids.length > 0 ? texts.join(' ').trim() : null;
  }

  /** The side the bubble is on now, which is another than asked for when there was no room. */
  async getPosition(): Promise<WjTooltipPosition> {
    const classes = (await (await this.bubble()).getAttribute('class')) ?? '';
    const side = /p-tooltip-(right|left|top|bottom)\b/.exec(classes)?.[1];
    if (side !== 'right' && side !== 'left' && side !== 'top' && side !== 'bottom') {
      throw new Error('The tooltip bubble has no position class');
    }
    return side;
  }
}
