import type { HarnessLoader } from '@angular/cdk/testing';
import { WjInputNumberHarness } from 'weeljack-ng/inputnumber/testing';

/** Steps the input named "Guests" up twice with the arrow key, and returns the number it then holds. */
export async function addTwoGuests(loader: HarnessLoader): Promise<number | null> {
  const guests = await loader.getHarness(WjInputNumberHarness.with({ ariaLabel: 'Guests' }));
  await guests.focus();
  await guests.increment();
  await guests.increment();
  return guests.getValue();
}
