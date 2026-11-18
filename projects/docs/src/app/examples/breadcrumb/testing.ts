import type { HarnessLoader } from '@angular/cdk/testing';
import { WjBreadcrumbHarness } from 'weeljack-ng/breadcrumb/testing';

/** Reads the trail named "Breadcrumb" and follows its "Menu" item in the fixture `loader` was made from. */
export async function goToMenu(loader: HarnessLoader): Promise<string[]> {
  const breadcrumb = await loader.getHarness(WjBreadcrumbHarness.with({ name: 'Breadcrumb' }));
  const labels = await breadcrumb.getItemLabels(); // ["Menu", "Breadcrumb"]

  // The home link is not an item: it has its own methods. A glyph-only home is named "Home".
  const home = (await breadcrumb.hasHome()) ? await breadcrumb.getHomeName() : null;

  // The last visible item is the current page. An item is found by its visible text.
  const current = await breadcrumb.getCurrentLabel(); // "Breadcrumb"
  const [menu] = await breadcrumb.getItems({ label: 'Menu' });
  if (menu !== undefined && !(await menu.isDisabled()) && current !== 'Menu') {
    await menu.click();
  }
  return home === null ? labels : [home, ...labels];
}
