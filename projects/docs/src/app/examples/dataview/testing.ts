import type { HarnessLoader } from '@angular/cdk/testing';
import { WjDataViewHarness } from 'weeljack-ng/dataview/testing';

/** Moves the view named "Products, paged" to its second page and returns the items it shows. */
export async function secondPage(loader: HarnessLoader): Promise<string[]> {
  const view = await loader.getHarness(WjDataViewHarness.with({ name: 'Products, paged' }));
  await view.goToNextPage();

  return view.getItemTexts(); // the six items of page two
}

/** Reads the layout of the view with the switch. */
export async function readTheLayout(loader: HarnessLoader): Promise<string> {
  const view = await loader.getHarness(
    WjDataViewHarness.with({ name: 'Products, with a layout switch' }),
  );
  return view.getLayout(); // 'grid' or 'list'
}

/** Returns the text the empty view shows. An empty view has no list, so it has no name to find it by. */
export async function readTheEmptyText(loader: HarnessLoader): Promise<string[]> {
  const texts: string[] = [];
  for (const view of await loader.getAllHarnesses(WjDataViewHarness)) {
    if (await view.isEmpty()) {
      texts.push(await view.getEmptyText()); // "No products match."
    }
  }
  return texts;
}
