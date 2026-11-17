import type { HarnessLoader } from '@angular/cdk/testing';
import { WjMegaMenuHarness } from 'weeljack-ng/megamenu/testing';

/** Opens the "Components" panel of the menu named "Documentation" and reads it. */
export async function readComponents(loader: HarnessLoader): Promise<string[]> {
  const menu = await loader.getHarness(WjMegaMenuHarness.with({ name: 'Documentation' }));
  const roots = await menu.getItemLabels(); // ["Home", "Components", "Overlays"]

  // A root item is found by its visible text. A panel's items are on the page only while it is open.
  const [components] = await menu.getItems({ label: 'Components' });
  if (components !== undefined && (await components.hasSubmenu())) {
    await components.openSubmenu();
    await components.getGroupLabels(); // ["Form", "Data", "Menus"]
    await components.getEntryLabels(); // ["Button", "Input text", …]
    await menu.clickItem('Button'); // a disabled item runs nothing when clicked
  }
  return roots;
}

/** Reads the Navigation button of a menu on a narrow screen, and opens its list. */
export async function openNavigation(loader: HarnessLoader): Promise<string | null> {
  const menu = await loader.getHarness(WjMegaMenuHarness.with({ name: 'Documentation' }));
  const name = await menu.getMobileButtonName(); // "Navigation", from the translation
  if (name !== null && !(await menu.isMobileMenuOpen())) {
    await menu.toggleMobileMenu();
  }
  return name;
}
