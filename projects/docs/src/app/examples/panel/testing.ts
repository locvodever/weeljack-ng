import type { HarnessLoader } from '@angular/cdk/testing';
import { WjPanelHarness } from 'weeljack-ng/panel/testing';

/** Collapses the panel titled "Order summary" in the fixture `loader` was made from. */
export async function collapseOrderSummary(loader: HarnessLoader): Promise<boolean> {
  const panel = await loader.getHarness(WjPanelHarness.with({ headerText: 'Order summary' }));
  await panel.toggle();
  return panel.isCollapsed();
}
