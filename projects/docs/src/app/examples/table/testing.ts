import type { HarnessLoader } from '@angular/cdk/testing';
import { WjTableHarness } from 'weeljack-ng/table/testing';

/** Sorts the table named "Orders" by customer and returns the first customer it then shows. */
export async function firstCustomerAscending(loader: HarnessLoader): Promise<string | undefined> {
  const table = await loader.getHarness(WjTableHarness.with({ caption: 'Orders' }));
  await table.sortBy('Customer');

  const sortOrder = await table.getSortOrder('Customer'); // 'ascending'
  const rows = await table.getCellTexts(); // one array of cell texts per row
  return sortOrder === 'ascending' ? rows[0]?.[1] : undefined;
}

/** Moves the paged table to its second page and returns the page the pager now shows. */
export async function openSecondPage(loader: HarnessLoader): Promise<number> {
  const table = await loader.getHarness(WjTableHarness.with({ caption: /paged/ }));
  await table.goToNextPage();
  return table.getCurrentPage();
}
