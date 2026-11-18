import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSplitButtonHarness } from 'weeljack-ng/splitbutton/testing';

/** Finds the split button labelled "Save", opens its menu and runs "Save as draft". */
export async function saveAsDraft(loader: HarnessLoader): Promise<string[]> {
  const splitButton = await loader.getHarness(WjSplitButtonHarness.with({ label: 'Save' }));

  // The main action: a click on the main button only.
  await splitButton.clickButton();

  // The menu is on the page only while it is open; its items are found by their visible text.
  await splitButton.openMenu();
  const labels = await splitButton.getItemLabels(); // ["Save as draft", "Save and close", ...]
  await splitButton.clickItem('Save as draft'); // a disabled item runs nothing when clicked

  // An item with a submenu is opened first, then its items are on the page.
  const [exportItem] = await splitButton.getItems({ label: 'Export' });
  if (exportItem !== undefined && (await exportItem.hasSubmenu())) {
    await exportItem.openSubmenu();
  }

  // The names a reader hears, and the state of the control.
  await splitButton.getMenuButtonName(); // "More actions"
  await splitButton.isMenuButtonDisabled(); // true while the model has no items
  return labels;
}
