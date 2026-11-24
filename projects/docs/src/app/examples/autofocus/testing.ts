import type { HarnessLoader } from '@angular/cdk/testing';
import { WjAutoFocusHarness } from 'weeljack-ng/autofocus/testing';

/**
 * Reads whether the element with `wjAutoFocus` that matches `selector`, or something inside it, has
 * focus. Optimus moves focus in a timer after the render, so call this from `expect.poll(() => …)`
 * rather than once right after `whenStable()`.
 */
export async function hasFocus(loader: HarnessLoader, selector: string): Promise<boolean> {
  const autoFocus = await loader.getHarness(WjAutoFocusHarness.with({ selector }));
  return autoFocus.isFocused();
}
