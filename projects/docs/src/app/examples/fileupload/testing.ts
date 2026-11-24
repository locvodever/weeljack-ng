import type { HarnessLoader } from '@angular/cdk/testing';
import { WjFileUploadHarness } from 'weeljack-ng/fileupload/testing';

/** Chooses two photos in the uploader, presses Upload, and returns the names that were queued. */
export async function uploadTwoPhotos(loader: HarnessLoader): Promise<string[]> {
  const uploader = await loader.getHarness(WjFileUploadHarness);
  await uploader.chooseFiles([
    new File(['first'], 'lake.png', { type: 'image/png' }),
    new File(['second'], 'hill.png', { type: 'image/png' }),
  ]);
  const queued = await uploader.getFileNames();
  await uploader.pressUpload();
  return queued;
}
