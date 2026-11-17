import type { HarnessLoader } from '@angular/cdk/testing';
import { WjPaginatorHarness } from 'weeljack-ng/paginator/testing';

/** Moves the pager named "Results pages" to its third page and returns the page it now shows. */
export async function openThirdPage(loader: HarnessLoader): Promise<number> {
  const pager = await loader.getHarness(WjPaginatorHarness.with({ name: 'Results pages' }));
  await pager.goToPage(3);
  return pager.getCurrentPage(); // 3
}

/** Picks 20 records a page in the pager that offers page sizes and reads the page count then. */
export async function pickTwentyRows(loader: HarnessLoader): Promise<number> {
  const pager = await loader.getHarness(WjPaginatorHarness.with({ name: /page sizes/ }));
  await pager.setRowsPerPage(20);
  return pager.getPageCount(); // 6 for 120 records
}

/** Reads the report of the pager named "Results pages, with a report". */
export async function readReport(loader: HarnessLoader): Promise<string | null> {
  const pager = await loader.getHarness(WjPaginatorHarness.with({ name: /with a report/ }));
  return pager.getReportText(); // "1–10 of 120"
}
