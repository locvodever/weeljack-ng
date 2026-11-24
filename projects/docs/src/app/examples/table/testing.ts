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

/** Selects the first two rows of the table named "Orders, many can be selected". */
export async function selectFirstTwo(loader: HarnessLoader): Promise<number[]> {
  const table = await loader.getHarness(
    WjTableHarness.with({ caption: 'Orders, many can be selected' }),
  );
  await table.selectRow(0);
  await table.selectRow(1);
  return table.getSelectedRowIndexes(); // [0, 1]
}

/** Expands the first row of the table named "Orders with details" and reads what it shows. */
export async function readFirstDetails(loader: HarnessLoader): Promise<string> {
  const table = await loader.getHarness(WjTableHarness.with({ caption: 'Orders with details' }));
  await table.toggleRowExpansion(0);
  return (await table.isRowExpanded(0)) ? table.getExpansionText(0) : '';
}

/** Filters the customer column of the row-filtered table, and reads what is left. */
export async function filterCustomers(loader: HarnessLoader, text: string): Promise<string[][]> {
  const table = await loader.getHarness(WjTableHarness.with({ caption: /filtered in a row/ }));
  await table.filterColumn('Customer', text);
  return (await table.isEmpty()) ? [] : table.getCellTexts();
}
