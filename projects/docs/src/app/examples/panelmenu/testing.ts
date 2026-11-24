import type { HarnessLoader } from '@angular/cdk/testing';
import { WjPanelMenuHarness } from 'weeljack-ng/panelmenu/testing';

/** Opens the "Data" panel of the menu in the page's `nav` and reads it. */
export async function readData(loader: HarnessLoader): Promise<string[]> {
  const menu = await loader.getHarness(WjPanelMenuHarness);
  await menu.getPanelLabels(); // ["Form", "Data", "Overlays"]

  // A panel is found by its header text. Its items are on the page only while it is open.
  const [data] = await menu.getPanels({ label: 'Data' });
  if (data !== undefined && !(await data.isExpanded())) {
    await data.toggle();
  }
  await menu.clickItem('Table'); // a disabled item runs nothing when clicked
  return (await data?.getItemLabels()) ?? []; // ["Table", "Paginator", "Data view"]
}
