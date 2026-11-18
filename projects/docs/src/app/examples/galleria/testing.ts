import type { HarnessLoader } from '@angular/cdk/testing';
import { WjGalleriaHarness } from 'weeljack-ng/galleria/testing';

/**
 * Steps the gallery named "Walks in the hills" two photos forward in the fixture `loader` was made
 * from, back one, and returns the item it shows. Items count from 0.
 */
export async function stepThrough(loader: HarnessLoader): Promise<number> {
  const gallery = await loader.getHarness(
    WjGalleriaHarness.with({ ariaLabel: 'Walks in the hills' }),
  );
  await gallery.next();
  await gallery.next();
  await gallery.previous();
  return gallery.getActiveIndex(); // 1
}

/**
 * Reads whether the one full-screen gallery in the fixture `loader` was made from is open and, when
 * it is, reads its caption and closes it. A closed full-screen gallery has no name to find it by,
 * so this takes the only one there is.
 */
export async function closeIfOpen(loader: HarnessLoader): Promise<string | null> {
  const gallery = await loader.getHarness(WjGalleriaHarness);
  if (!(await gallery.isFullScreenOpen())) {
    return null;
  }
  const caption = await gallery.getCaption();
  await gallery.closeFullScreen();
  return caption;
}
