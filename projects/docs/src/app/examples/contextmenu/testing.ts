import type { HarnessLoader } from '@angular/cdk/testing';
import { WjContextMenuHarness } from 'weeljack-ng/contextmenu/testing';

/** Opens the menu with a right-click on the target, then reads and runs it. */
export async function copyLink(loader: HarnessLoader, target: HTMLElement): Promise<string[]> {
  target.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }),
  );

  // The menu lives in `body`: the harness finds it there, and it renders nothing until it is open.
  const menu = await loader.getHarness(WjContextMenuHarness);
  const labels = (await menu.isOpen()) ? await menu.getItemLabels() : [];
  // ["Open", "Rename…", "Duplicate", "Share", "Delete"]

  // An item is found by its visible text, at any level that is open.
  const [share] = await menu.getItems({ label: 'Share' });
  await share?.openSubmenu();
  await menu.clickItem('Copy link'); // runs its command and closes the menu
  return labels;
}
