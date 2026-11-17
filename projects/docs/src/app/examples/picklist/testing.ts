import type { HarnessLoader } from '@angular/cdk/testing';
import { WjPickListHarness } from 'weeljack-ng/picklist/testing';

/** Shows the “Phone” column: selects it in the source list, moves it across and returns the target. */
export async function showThePhoneColumn(loader: HarnessLoader): Promise<string[]> {
  const list = await loader.getHarness(WjPickListHarness);
  await list.selectSourceItem('Phone');
  await list.moveToTarget();

  return list.getTargetItemTexts(); // the columns that were already visible, then "Phone"
}

/** Hides every column again and returns what is left in the target list. */
export async function hideEveryColumn(loader: HarnessLoader): Promise<string[]> {
  const list = await loader.getHarness(WjPickListHarness);
  await list.moveAllToSource();

  return list.getTargetItemTexts(); // empty
}
