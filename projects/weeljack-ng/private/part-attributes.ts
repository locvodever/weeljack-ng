type Bag = Readonly<Record<string, unknown>>;

/** A routed attribute value. `undefined` and `null` are omitted. */
export type _PartAttributeValue = string | number | boolean | null | undefined;

function isBag(value: unknown): value is Bag {
  return typeof value === 'object' && value !== null;
}

function isFunction(value: unknown): value is (context: unknown) => unknown {
  return typeof value === 'function';
}

/** Resolves the function form of a pass-through node; anything else is returned as is. */
function resolve(node: unknown, context: unknown): unknown {
  return isFunction(node) ? node(context) : node;
}

/** Copies `node` and sets `attributes` on the part at `path`, keeping every other key. */
function setAt(node: unknown, path: readonly string[], attributes: Bag, context: unknown): Bag {
  const bag = isBag(node) ? node : {};
  const [head, ...rest] = path;
  if (head === undefined) {
    // The part itself: a string is a class list (Optimus accepts it), an object keeps its keys.
    return { ...(typeof node === 'string' ? { class: node } : bag), ...attributes };
  }
  return { ...bag, [head]: setAt(resolve(bag[head], context), rest, attributes, context) };
}

/**
 * Merges a wrapper's routed attributes into the consumer's `pt` (09, 02 Q8). `pt` may be the
 * object or the function form, as Optimus accepts; `partPath` names the part, dotted for a nested
 * one (`root`, `pcInputText.root`). Every consumer key is kept, and a routed attribute wins over
 * a consumer attribute of the same name. Returns the function form, ready to bind to `[pt]`.
 *
 * The result is typed as the consumer's `pt` type `T`, but the merge works on untyped bags, so
 * `partPath` is not checked against `T`'s keys: a wrong path adds a part Optimus ignores.
 *
 * @docs-private
 */
export function _mergePartAttributes<C, T extends object>(
  pt: T | ((context: C) => T) | null | undefined,
  partPath: string,
  attributes: Readonly<Record<string, _PartAttributeValue>>,
): (context: C) => T {
  const own: Record<string, string | number | boolean> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      own[name] = value;
    }
  }
  const path = partPath.split('.');
  return (context) =>
    // type-escape: the merge runs on untyped bags; T is the consumer's own pt type, kept by contract
    setAt(resolve(pt, context), path, own, context) as unknown as T;
}
