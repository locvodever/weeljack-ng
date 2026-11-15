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

/** One public method of an exported `@Injectable` class. */
export interface ApiMethod {
  name: string;
  signature: string;
  description: string;
}

/** One public property of an exported `@Injectable` class. */
export interface ApiProperty {
  name: string;
  type: string;
  description: string;
  readonly: boolean;
}

/** An exported `@Injectable` class. `providedIn` is `null` when the decorator has none. */
export interface ApiService {
  name: string;
  providedIn: string | null;
  description: string;
  methods: ApiMethod[];
  properties: ApiProperty[];
}

/** The generated `api/<entry>.json`. */
export interface ApiDocument {
  entry: string;
  importPath: string;
  classes: ApiClass[];
  types: ApiType[];
  services: ApiService[];
}
