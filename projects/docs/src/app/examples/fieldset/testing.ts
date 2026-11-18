import type { HarnessLoader } from '@angular/cdk/testing';
import { WjFieldsetHarness } from 'weeljack-ng/fieldset/testing';

/** Collapses the fieldset whose legend is "Order notes" in the fixture `loader` was made from. */
export async function collapseOrderNotes(loader: HarnessLoader): Promise<boolean> {
  const fieldset = await loader.getHarness(WjFieldsetHarness.with({ legend: 'Order notes' }));
  await fieldset.toggle();
  return fieldset.isCollapsed();
}
