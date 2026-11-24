import type { HarnessLoader } from '@angular/cdk/testing';
import { WjMenubarHarness } from 'weeljack-ng/menubar/testing';

/** Opens the "Edit" dropdown of the bar named "Editor" and runs "Copy". */
export async function copy(loader: HarnessLoader): Promise<string[]> {
  const bar = await loader.getHarness(WjMenubarHarness.with({ name: 'Editor' }));
  const labels = await bar.getItemLabels(); // ["File", "Edit", "View", "Help"]

  // An item is found by its visible text. A dropdown's items are on the page only while it is open.
  const [edit] = await bar.getItems({ label: 'Edit' });
  if (edit !== undefined && (await edit.hasSubmenu())) {
    await edit.openSubmenu();
    await bar.clickItem('Copy'); // a disabled item runs nothing when clicked
  }
  return labels;
}

/** Reads the Navigation button of a bar on a narrow screen, and opens its list. */
export async function openNavigation(loader: HarnessLoader): Promise<string | null> {
  const bar = await loader.getHarness(WjMenubarHarness.with({ name: 'Editor' }));
  const name = await bar.getMobileButtonName(); // "Navigation", from the translation
  if (name !== null && !(await bar.isMobileMenuOpen())) {
    await bar.toggleMobileMenu();
  }
  return name;
}
