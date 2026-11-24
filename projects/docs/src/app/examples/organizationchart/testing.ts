import type { HarnessLoader } from '@angular/cdk/testing';
import { WjOrganizationChartHarness } from 'weeljack-ng/organizationchart/testing';

/** Collapses Design in the chart, then reads the nodes still on screen, in document order. */
export async function collapseDesign(loader: HarnessLoader): Promise<string[]> {
  const chart = await loader.getHarness(WjOrganizationChartHarness);
  const [design] = await chart.getNodes({ text: 'Design' });
  if (design && (await design.isExpanded())) {
    await design.toggle();
  }

  const texts: string[] = [];
  for (const node of await chart.getNodes()) {
    texts.push(await node.getText());
  }
  return texts; // "Studio", "Design", "Engineering", "Web", "Mobile"
}

/** Reads the name a screen reader gives the toggle of Engineering, and whether it is open. */
export async function readEngineeringToggle(
  loader: HarnessLoader,
): Promise<[string | null, boolean]> {
  const chart = await loader.getHarness(WjOrganizationChartHarness);
  const [engineering] = await chart.getNodes({ text: 'Engineering' });

  return [
    (await engineering?.getToggleLabel()) ?? null,
    (await engineering?.isExpanded()) ?? false,
  ]; // "Engineering", true
}
