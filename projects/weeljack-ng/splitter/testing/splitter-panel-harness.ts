import { ContentContainerComponentHarness } from '@angular/cdk/testing';

/**
 * Test harness for one panel of a `wj-splitter`. Its host is the panel the splitter drew, never
 * the hidden `wj-splitter-panel` element, which holds nothing. It is a container: what you put
 * inside the panel is reachable through it.
 */
export class WjSplitterPanelHarness extends ContentContainerComponentHarness {
  static hostSelector = '[data-pc-section="panel"]';

  /** The panel's box in pixels, as the user sees it. */
  async getSize(): Promise<{ width: number; height: number }> {
    const { width, height } = await (await this.host()).getDimensions();
    return { width, height };
  }
}
