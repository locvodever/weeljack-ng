import type { Type } from '@angular/core';
import type { ApiDocument } from '../../api/api-types';

/** A live example. Its source panel shows `examples/<sourceKey>.ts`. */
export interface ExampleDoc {
  title: string;
  description: string;
  /** Key into the generated `examples.json`: `<entry>/<file stem>`. */
  sourceKey: string;
  /** The standalone component rendered above the source; `null` for a source-only example. */
  component: Type<unknown> | null;
}

export interface KeyboardRow {
  key: string;
  effect: string;
}

export interface PassThroughPart {
  part: string;
  description: string;
}

export interface MappingRow {
  /** What the Optimus component calls it. */
  optimus: string;
  /** What `wj-*` calls it, or what replaces it. */
  weeljack: string;
  status: 'kept' | 'renamed' | 'added' | 'dropped';
  note: string;
}

/** One public `--wj-*` custom property of a component. */
export interface CustomPropertyRow {
  /** The property name, `--wj-...`. */
  name: string;
  defaultValue: string;
  description: string;
}

/** The hand-written part of a component page. Inputs, outputs and models are generated. */
export interface ComponentDoc {
  entry: string;
  title: string;
  purpose: string;
  examples: ExampleDoc[];
  keyboard: KeyboardRow[];
  aria: string[];
  stylingIntro: string;
  /** The `pt` parts. `[]` for an own component, which has no `pt`: no `pt` table is rendered. */
  parts: PassThroughPart[];
  /** Public `--wj-*` custom properties, rendered as the first table of the Styling section. */
  customProperties?: CustomPropertyRow[];
  /** The Optimus selector the mapping sentence names. Defaults to `p-<entry>`. */
  optimusSelector?: string;
  /** The Optimus to WeeljackNg mapping (02). `[]` for an own component: the section is omitted. */
  mapping: MappingRow[];
}

/**
 * What the `components/:entry` route resolves before the page renders: the entry's content and its
 * generated API, each loaded from its own chunk (`COMPONENT_DOCS`, `API_DOCUMENTS`).
 */
export interface ComponentPageData {
  doc: ComponentDoc;
  api: ApiDocument;
}
