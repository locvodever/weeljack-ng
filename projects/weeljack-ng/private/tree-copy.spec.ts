import { _copyTree } from './tree-copy';

interface Node {
  key?: string;
  label?: string;
  data?: { size: number };
  expanded?: boolean;
  leaf?: boolean;
  children?: Node[];
}

/** Freezes the node, its `children` array and everything below, as an app's immutable state is. */
function deepFreeze<T extends Node>(node: T): T {
  node.children?.forEach(deepFreeze);
  if (node.children) {
    Object.freeze(node.children);
  }
  return Object.freeze(node);
}

function makeTree(): Node[] {
  return [
    {
      key: 'docs',
      label: 'Documents',
      data: { size: 3 },
      expanded: false,
      children: [
        { key: 'docs/a', label: 'A', data: { size: 1 } },
        { key: 'docs/b', label: 'B', data: { size: 2 } },
      ],
    },
    { key: 'lazy', label: 'Lazy', leaf: false },
    { label: 'No key' },
  ];
}

/** The node at `path` (child indexes), or a throw: keeps the specs free of `!`. */
function at(nodes: Node[], ...path: number[]): Node {
  let list = nodes;
  let found: Node | undefined;
  for (const index of path) {
    found = list[index];
    if (found === undefined) {
      throw new Error(`no node at ${path.join('/')}`);
    }
    list = found.children ?? [];
  }
  if (found === undefined) {
    throw new Error('empty path');
  }
  return found;
}

describe('_copyTree', () => {
  it('copies every node into a new object with a new children array, and leaves the app’s tree alone', () => {
    const tree = makeTree()
      .filter((node) => node.leaf !== false)
      .map(deepFreeze);
    const snapshot = structuredClone(tree);

    const { nodes } = _copyTree(tree);

    expect(nodes).not.toBe(tree);
    expect(nodes).toEqual(snapshot);
    expect(nodes[0]).not.toBe(tree[0]);
    expect(nodes[0]?.children).not.toBe(tree[0]?.children);
    expect(at(nodes, 0, 1)).not.toBe(at(tree, 0, 1));
    expect(tree).toEqual(snapshot);
  });

  it('lets the copy be written, which is the point: the frozen original is not', () => {
    const tree = makeTree().map(deepFreeze);
    const { nodes } = _copyTree(tree);
    const first = at(nodes, 0);

    first.expanded = true;
    Reflect.set(first, 'parent', null);

    expect(first.expanded).toBe(true);
    expect(() => {
      at(tree, 0).expanded = true;
    }).toThrow(TypeError);
    expect(at(tree, 0).expanded).toBe(false);
  });

  it('shares data by reference', () => {
    const tree = makeTree();

    const { nodes } = _copyTree(tree);

    expect(at(nodes, 0).data).toBe(at(tree, 0).data);
    expect(at(nodes, 0, 1).data).toBe(at(tree, 0, 1).data);
  });

  it('copies nothing from nothing', () => {
    expect(_copyTree<Node>(undefined).nodes).toEqual([]);
    expect(_copyTree<Node>(null).nodes).toEqual([]);
    expect(_copyTree<Node>([]).nodes).toEqual([]);
  });

  describe('original and copyOf', () => {
    it('round-trip by identity, for the app’s node and for its copy', () => {
      const tree = makeTree();
      const result = _copyTree(tree);
      const copy = at(result.nodes, 0, 1);
      const app = at(tree, 0, 1);

      expect(result.original(copy)).toBe(app);
      expect(result.copyOf(app)).toBe(copy);
      expect(result.copyOf(result.original(copy))).toBe(copy);
    });

    it('find a copy by key when the node is a different object', () => {
      const result = _copyTree(makeTree());
      const sameKey: Node = { key: 'docs/b', label: 'Another object, same key' };

      expect(result.copyOf(sameKey)).toBe(at(result.nodes, 0, 1));
    });

    it('send an object they did not make back as it is', () => {
      const result = _copyTree(makeTree());
      const stranger: Node = { key: 'elsewhere', label: 'Not in the tree' };
      const keyless: Node = { label: 'No key either' };

      expect(result.copyOf(stranger)).toBe(stranger);
      expect(result.copyOf(keyless)).toBe(keyless);
      expect(result.original(stranger)).toBe(stranger);
    });

    it('do not take a key that names a prototype member for a match', () => {
      const result = _copyTree(makeTree(), { constructor: true, toString: true });
      const prototype: Node = { key: 'constructor' };

      expect(result.copyOf(prototype)).toBe(prototype);
      expect(at(result.nodes, 0).expanded).toBe(false);
    });
  });

  describe('expandedKeys', () => {
    it('win over the node’s own expanded, in both directions', () => {
      const tree = makeTree();
      tree[0] = { ...at(tree, 0), expanded: true };
      tree.push({ key: 'closed', expanded: false });

      const { nodes } = _copyTree(tree, { docs: false, closed: true });

      expect(at(nodes, 0).expanded).toBe(false);
      expect(at(nodes, 3).expanded).toBe(true);
    });

    it('apply at any depth, and leave a node with no entry on its own expanded', () => {
      const { nodes } = _copyTree(makeTree(), { 'docs/a': true });

      expect(at(nodes, 0, 0).expanded).toBe(true);
      expect(at(nodes, 0, 1).expanded).toBeUndefined();
      expect(at(nodes, 0).expanded).toBe(false);
    });

    it('never apply to a node with no key', () => {
      const { nodes } = _copyTree(makeTree(), { undefined: true });

      expect(at(nodes, 2).expanded).toBeUndefined();
    });

    it('are read from a frozen map', () => {
      const keys = Object.freeze({ docs: true });

      expect(at(_copyTree(makeTree(), keys).nodes, 0).expanded).toBe(true);
    });
  });

  describe('leaf: false', () => {
    it('gets an empty children array, so a row can open from the keyboard', () => {
      const tree = makeTree().map(deepFreeze);

      const { nodes } = _copyTree(tree);

      expect(at(nodes, 1).children).toEqual([]);
      expect(at(tree, 1).children).toBeUndefined();
    });

    it('keeps the children it has, and gives a plain node none', () => {
      const tree: Node[] = [{ key: 'a', leaf: false, children: [{ key: 'b' }] }, { key: 'c' }];

      const { nodes } = _copyTree(tree);

      expect(at(nodes, 0).children).toHaveLength(1);
      expect(at(nodes, 1).children).toBeUndefined();
    });
  });

  describe('the partial mark', () => {
    it('carries from the previous copy of the same node, by identity', () => {
      const tree = makeTree();
      const first = _copyTree(tree);
      Reflect.set(at(first.nodes, 0), 'partialSelected', true);

      const second = _copyTree(tree, undefined, first);

      expect(Reflect.get(at(second.nodes, 0), 'partialSelected')).toBe(true);
      expect(Reflect.get(at(second.nodes, 0, 0), 'partialSelected')).toBeUndefined();
    });

    it('carries by key when the app set a new tree of new objects', () => {
      const first = _copyTree(makeTree());
      Reflect.set(at(first.nodes, 0, 1), 'partialSelected', true);

      const second = _copyTree(makeTree(), undefined, first);

      expect(Reflect.get(at(second.nodes, 0, 1), 'partialSelected')).toBe(true);
      expect(Reflect.get(at(second.nodes, 0), 'partialSelected')).toBeUndefined();
    });

    it('is not carried for a node that was not marked, or is new', () => {
      const first = _copyTree(makeTree());
      Reflect.set(at(first.nodes, 0), 'partialSelected', false);

      const second = _copyTree([...makeTree(), { key: 'new' }], undefined, first);

      expect(Reflect.get(at(second.nodes, 0), 'partialSelected')).toBeUndefined();
      expect(Reflect.get(at(second.nodes, 3), 'partialSelected')).toBeUndefined();
    });

    it('does not change the previous copy', () => {
      const first = _copyTree(makeTree());
      Reflect.set(at(first.nodes, 0), 'partialSelected', true);

      _copyTree(makeTree(), { docs: true }, first);

      expect(Reflect.get(at(first.nodes, 0), 'partialSelected')).toBe(true);
      expect(at(first.nodes, 0).expanded).toBe(false);
    });
  });

  it('goes through a deep-frozen tree, a frozen map and a previous copy without a throw', () => {
    const tree = makeTree().map(deepFreeze);
    const keys = Object.freeze({ docs: true });
    const first = _copyTree(tree, keys);
    Reflect.set(at(first.nodes, 0), 'partialSelected', true);

    expect(() => _copyTree(Object.freeze(tree), keys, first)).not.toThrow();
  });
});
