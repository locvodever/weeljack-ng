/** One input, output or two-way model, as `scripts/extract-api.mjs` writes it. */
export interface ApiMember {
  name: string;
  alias: string;
  type: string;
  description: string;
  defaultValue: string | null;
  required: boolean;
}

export interface ApiClass {
  name: string;
  kind: string;
  selector: string;
  description: string;
  inputs: ApiMember[];
  outputs: ApiMember[];
  models: ApiMember[];
}

export interface ApiType {
  name: string;
  type: string;
  description: string;
}

/** The generated `api/<entry>.json`. */
export interface ApiDocument {
  entry: string;
  importPath: string;
  classes: ApiClass[];
  types: ApiType[];
}
