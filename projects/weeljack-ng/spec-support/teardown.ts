import { TestBed } from '@angular/core/testing';

/**
 * An `afterEach` for a spec file whose specs can leave an overlay open: runs `close`, which
 * closes what was left open and waits for it to leave, then `reset`, always.
 *
 * Vitest runs no later after-hook once one throws, and the hook it then skips is the one that
 * resets TestBed. A `close` that timed out on one stuck overlay would make every later spec in the
 * file fail with "Cannot configure the test module when the test module has already been
 * instantiated". So when `close` throws, this resets TestBed itself, runs `reset`, and rethrows:
 * the spec that left the overlay still fails, and nothing after it does.
 */
export async function afterOverlay(
  close: () => Promise<void>,
  reset: () => void | Promise<void>,
): Promise<void> {
  try {
    await close();
  } catch (error) {
    TestBed.resetTestingModule();
    throw error;
  } finally {
    await reset();
  }
}
