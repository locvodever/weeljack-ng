import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTreeTableHarness } from 'weeljack-ng/treetable/testing';

/** Opens Documents in the table named "Files", then reads the cells on screen, row by row. */
export async function openDocuments(loader: HarnessLoader): Promise<string[][]> {
  const table = await loader.getHarness(WjTreeTableHarness.with({ name: 'Files' }));
  const [documents] = await table.getRows({ text: 'Documents' });
  await documents?.toggle();

  return table.getCellTexts(); // ["Documents", "220", "Folder"], ["Report.pdf", "180", "PDF"], ...
}

/** Sorts "Files, sortable" by Size, descending, then reads the header's sort state. */
export async function sortBySize(loader: HarnessLoader): Promise<string> {
  const table = await loader.getHarness(WjTreeTableHarness.with({ name: 'Files, sortable' }));
  await table.sortBy('Size');
  await table.sortBy('Size');

  return table.getSortOrder('Size'); // "descending"
}

/** Selects Music in "Files, one can be selected", then reads its level and whether it is picked. */
export async function readTheSelection(loader: HarnessLoader): Promise<[number, boolean]> {
  const table = await loader.getHarness(
    WjTreeTableHarness.with({ name: 'Files, one can be selected' }),
  );
  const [music] = await table.getRows({ text: 'Music' });
  await music?.select();

  return [(await music?.getLevel()) ?? 0, (await music?.isSelected()) ?? false]; // 1, true
}
