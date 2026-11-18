import type { HarnessLoader } from '@angular/cdk/testing';
import { WjImageHarness } from 'weeljack-ng/image/testing';

/**
 * Opens the preview of the image whose text alternative is "A green hill under a yellow sun" in the
 * fixture `loader` was made from, rotates it once and closes it. Returns false when the image
 * offers no preview.
 */
export async function previewHill(loader: HarnessLoader): Promise<boolean> {
  const image = await loader.getHarness(WjImageHarness.with({ alt: /green hill/ }));
  if (!(await image.hasPreview())) {
    return false;
  }
  await image.openPreview();
  await image.rotateRight();
  const open = await image.isPreviewOpen();
  await image.closePreview();
  return open;
}
