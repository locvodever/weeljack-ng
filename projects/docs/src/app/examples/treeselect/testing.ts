import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTreeSelectHarness } from 'weeljack-ng/treeselect/testing';

/**
 * Picks Mobile in the tree select that shows "Select a department": expand Engineering, pick
 * Mobile, and return the text the control then shows. `selectNode` opens the panel itself, but
 * Optimus ignores a pick made while the panel is still opening: in a spec, wait for the panel to
 * finish opening first, as a user would, before picking.
 */
export async function pickMobile(loader: HarnessLoader): Promise<string> {
  const select = await loader.getHarness(
    WjTreeSelectHarness.with({ valueText: 'Select a department' }),
  );
  await select.expandNode('Engineering');
  await select.selectNode('Mobile');

  return select.getValueText(); // "Mobile"
}
