import type { HarnessLoader } from '@angular/cdk/testing';
import { WjMenuHarness } from 'weeljack-ng/menu/testing';

/** Reads the items of the menu named "File" and runs "Save" in the fixture `loader` was made from. */
export async function save(loader: HarnessLoader): Promise<string[]> {
  const menu = await loader.getHarness(WjMenuHarness.with({ name: 'File' }));
  const labels = await menu.getItemLabels(); // ["New", "Open…", "Save", …]

  // An item is found by its visible text. A disabled item runs nothing when clicked.
  const [item] = await menu.getItems({ label: 'Save' });
  if (item !== undefined && !(await item.isDisabled())) {
    await item.click();
  }
  return labels;
}

/** Reads a popup menu named "Actions": it renders nothing until it is open. */
export async function readActions(loader: HarnessLoader): Promise<string[]> {
  const menu = await loader.getHarness(WjMenuHarness.with({ name: 'Actions' }));
  return (await menu.isOpen()) ? menu.getItemLabels() : [];
}
