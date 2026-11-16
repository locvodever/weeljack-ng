/*
 * `weeljack-ng/locale`: complete UI translations to pass to `provideWeeljack({ translation })`.
 * `en` is the default the root merges over; `vi` is Vietnamese. The root is imported for its
 * type only, so this entry has no runtime import of it.
 */
import type { WjTranslation } from 'weeljack-ng';
import { _WJ_EN } from 'weeljack-ng/private';

/** English: the very object `provideWeeljack` merges `translation` over. */
export const en: WjTranslation = _WJ_EN;
export { vi } from './vi';
