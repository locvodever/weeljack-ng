import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTreeHarness } from 'weeljack-ng/tree/testing';

/** Opens Documents in the tree named "Files", then reads the nodes on screen, in order. */
export async function openDocuments(loader: HarnessLoader): Promise<string[]> {
  const tree = await loader.getHarness(WjTreeHarness.with({ name: 'Files' }));
  const [documents] = await tree.getNodes({ text: 'Documents' });
  await documents?.expand();

  return tree.getNodeTexts(); // "Documents", "Reports", "Invoices", "Pictures", "Music", "Archive"
}

/** Selects Music in "Folders, one can be selected", then reads its level and whether it is picked. */
export async function readTheSelection(loader: HarnessLoader): Promise<[number, boolean]> {
  const tree = await loader.getHarness(
    WjTreeHarness.with({ name: 'Folders, one can be selected' }),
  );
  const [music] = await tree.getNodes({ text: 'Music' });
  await music?.select();

  return [(await music?.getLevel()) ?? 0, (await music?.isSelected()) ?? false]; // 1, true
}
