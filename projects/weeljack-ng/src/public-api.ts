/*
 * Public API surface of the root entry `weeljack-ng`: `provideWeeljack`, its option type and the
 * brand colour and translation types, nothing else. The root never exports a component or
 * re-exports another entry (01 Q2).
 */
export { type WjColorScale } from './brand';
export { provideWeeljack, type WjThemeOptions } from './provide-weeljack';
export { type WjOwnStrings, type WjTranslation } from './translation';
