import type { WjColorScale } from './brand';

/**
 * A WeeljackNg base preset (ADR 0010). Import one from its own entry (`weeljack-ng/preset-noir`,
 * `weeljack-ng/preset-aura`) and pass it as `provideWeeljack({ preset })`. Its fields are internal
 * and outside semver: an app never reads or builds one, and a raw Optimus preset is not one.
 */
export interface WjPreset {
  /**
   * The Optimus base the preset is built on. Required.
   *
   * @docs-private
   */
  readonly _base: object;
  /**
   * One plain layer over the guarantees: the base's corrections and the preset's own surfaces,
   * borders and corners. It stays under an app's `primary` and `surface`.
   *
   * @docs-private
   */
  readonly _look?: object;
  /**
   * The preset's own colour (`'{emerald}'`). A preset sets this or `_ink`, never both. An app's
   * valid `primary` replaces it.
   *
   * @docs-private
   */
  readonly _primary?: WjColorScale;
  /**
   * A fixed primary layer (Noir's ink). A preset sets this or `_primary`, never both. An app's
   * valid `primary` replaces it.
   *
   * @docs-private
   */
  readonly _ink?: object;
  /**
   * Per-palette corrections a base needs over the brand branch. It is called with the palette name
   * of the colour that applies, or `''` for a hex or a scale, and returns a layer or `undefined`.
   *
   * @docs-private
   */
  readonly _brand?: (name: string) => object | undefined;
}
