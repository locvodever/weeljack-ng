import aura from '@openng/optimus-ui-themes/aura';
import type { WjPreset } from 'weeljack-ng';

/**
 * Aura's own emerald at its light AA step (700), on Aura's own slate surfaces, under every
 * WeeljackNg guarantee. An app's valid `primary` and its `surface` still apply on top.
 */
export const wjAura: WjPreset = { _base: aura, _primary: '{emerald}' };
