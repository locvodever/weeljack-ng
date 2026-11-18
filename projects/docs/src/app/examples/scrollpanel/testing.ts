import type { HarnessLoader } from '@angular/cdk/testing';
import { WjScrollPanelHarness } from 'weeljack-ng/scrollpanel/testing';

/** Reads the "Terms of use" panel: whether it scrolls, how far it is scrolled, and its role. */
export async function readTerms(
  loader: HarnessLoader,
): Promise<{ canScroll: boolean; scrollTop: number; role: string | null }> {
  const terms = await loader.getHarness(WjScrollPanelHarness.with({ label: 'Terms of use' }));
  await terms.focus();
  return {
    canScroll: await terms.canScroll(),
    scrollTop: await terms.getScrollTop(),
    role: await terms.getRole(),
  };
}
