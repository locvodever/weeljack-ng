import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTieredMenuHarness } from 'weeljack-ng/tieredmenu/testing';

/** Opens the submenu of "Export" in the menu named "File" and reads what is on the page. */
export async function exportFormats(loader: HarnessLoader): Promise<string[]> {
  const menu = await loader.getHarness(WjTieredMenuHarness.with({ name: 'File' }));
  const labels = await menu.getItemLabels(); // ["New", "Open…", "Export", "Print…"]

  // An item is found by its visible text, at any level that is open.
  const [exportItem] = await menu.getItems({ label: 'Export' });
  if (exportItem !== undefined && (await exportItem.hasSubmenu())) {
    await exportItem.openSubmenu();
    await menu.clickItem('PDF'); // a disabled item runs nothing when clicked
  }
  return labels;
}

/** Reads a popup menu named "File": it renders nothing until it is open. */
export async function readFile(loader: HarnessLoader): Promise<string[]> {
  const menu = await loader.getHarness(WjTieredMenuHarness.with({ name: 'File' }));
  return (await menu.isOpen()) ? menu.getItemLabels() : [];
}
