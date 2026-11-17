import type { HarnessLoader } from '@angular/cdk/testing';
import { WjOrderListHarness } from 'weeljack-ng/orderlist/testing';

/** Selects "Book the venue" in the list named "Tasks", moves it to the top and returns the order. */
export async function bookTheVenueFirst(loader: HarnessLoader): Promise<string[]> {
  const list = await loader.getHarness(WjOrderListHarness.with({ name: 'Tasks' }));
  await list.selectItem('Book the venue');
  await list.moveTop();

  return list.getItemTexts(); // "Book the venue" first, the others in their old order
}

/** Types "the" into the filter of the list named "Tasks, filterable" and returns what is left. */
export async function filterTheTasks(loader: HarnessLoader): Promise<string[]> {
  const list = await loader.getHarness(WjOrderListHarness.with({ name: /filterable/ }));
  await list.filter('the');

  return list.getItemTexts(); // only the tasks whose name has "the" in it
}
