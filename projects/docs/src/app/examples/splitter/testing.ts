import type { HarnessLoader } from '@angular/cdk/testing';
import { WjSplitterHarness } from 'weeljack-ng/splitter/testing';

/**
 * Reads the splitter in the fixture `loader` was made from: which way it runs, how its panels
 * share the width, and what its one gutter reports once it has focus.
 */
export async function readSplitter(loader: HarnessLoader): Promise<{
  orientation: string;
  sizes: number[];
  label: string | null;
  value: number | null;
}> {
  const splitter = await loader.getHarness(WjSplitterHarness);
  await splitter.focusGutter();
  return {
    orientation: await splitter.getOrientation(),
    sizes: await splitter.getPanelSizes(),
    label: await splitter.getGutterLabel(),
    value: await splitter.getGutterValue(),
  };
}
