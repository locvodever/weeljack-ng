import type { HarnessLoader } from '@angular/cdk/testing';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjDrawerHarness } from 'weeljack-ng/drawer/testing';

/** Applies the "Filters" drawer in the fixture `loader` was made from, from the right edge. */
export async function applyFilters(loader: HarnessLoader): Promise<string> {
  const drawer = await loader.getHarness(WjDrawerHarness.with({ title: 'Filters' }));
  const position = await drawer.getPosition();

  // The body and the footer are inside the drawer, so its harness reaches the buttons.
  const apply = await drawer.getHarness(WjButtonHarness.with({ label: 'Apply' }));
  await apply.click();
  return position;
}

/** Clicks the backdrop of the open drawer, as a user does, and says whether it closed. */
export async function dismissWithBackdrop(loader: HarnessLoader): Promise<boolean> {
  const drawer = await loader.getHarness(WjDrawerHarness);
  await drawer.clickBackdrop();
  return !(await drawer.isOpen());
}
