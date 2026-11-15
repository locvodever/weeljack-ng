import type { Type } from '@angular/core';

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

/** The hand-written part of a component page. Inputs, outputs and models are generated. */
export interface ComponentDoc {
  entry: string;
  title: string;
  purpose: string;
  examples: ExampleDoc[];
  keyboard: KeyboardRow[];
  aria: string[];
  stylingIntro: string;
  parts: PassThroughPart[];
  /** The Optimus to WeeljackNg mapping (02): kept, renamed, added, dropped. */
  mapping: MappingRow[];
}
