import type { MegaMenuItem, MenuItem } from '@openng/optimus-ui/api';
import {
  _toOptimusMegaMenuModel,
  _toOptimusMenuModel,
  type _MegaMenuItemShape,
  type _MenuItemShape,
} from './menu-model';

/** An app item type of its own, wider than the shape, as an app's might be. */
interface AppItem extends _MenuItemShape<AppItem> {
  id?: number;
}

const click = new Event('click');

describe('_toOptimusMenuModel', () => {
  it('copies only the allow-listed fields, field by field', () => {
    const items: AppItem[] = [
      {
        label: 'Open',
        disabled: true,
        visible: false,
        separator: false,
        expanded: true,
        url: '/open',
        target: '_blank',
        routerLink: ['/a', 'b'],
        queryParams: { q: 1 },
        fragment: 'top',
      },
    ];

    const { items: copies } = _toOptimusMenuModel(items);

    expect(copies).toEqual([
      {
        escape: true,
        label: 'Open',
        disabled: true,
        visible: false,
        separator: false,
        expanded: true,
        url: '/open',
        target: '_blank',
        routerLink: ['/a', 'b'],
        queryParams: { q: 1 },
        fragment: 'top',
      },
    ]);
  });

  it('writes no key for a field the item does not have', () => {
    const [copy] = _toOptimusMenuModel<AppItem>([{ label: 'Open' }]).items;

    expect(Object.keys(copy ?? {}).sort()).toEqual(['escape', 'label']);
  });

  it('never copies a field outside the allow-list, even on a wider object', () => {
    const wider = {
      label: 'Open',
      escape: false,
      styleClass: 'x',
      icon: 'pi pi-x',
      tooltipOptions: { escape: false },
      id: 7,
    };
    const items: AppItem[] = [wider];

    const [copy] = _toOptimusMenuModel(items).items;

    expect(copy).toStrictEqual({ escape: true, label: 'Open' });
  });

  it('forces escape: true on every item at every level', () => {
    const items: AppItem[] = [
      { label: 'A', items: [{ label: 'B', items: [{ label: 'C' }, { separator: true }] }] },
      { separator: true },
    ];

    const { items: copies } = _toOptimusMenuModel(items);

    const escapes: (boolean | undefined)[] = [];
    const walk = (list: MenuItem[] | undefined): void => {
      for (const item of list ?? []) {
        escapes.push(item.escape);
        walk(item.items);
      }
    };
    walk(copies);
    expect(escapes).toEqual([true, true, true, true, true]);
  });

  it('wraps a command so the app gets { originalEvent, item } with its own object', () => {
    const received: { originalEvent: Event; item: AppItem }[] = [];
    const child: AppItem = {
      label: 'Child',
      command: (event) => {
        received.push(event);
      },
    };
    const root: AppItem = { label: 'Root', items: [child] };

    const { items: copies } = _toOptimusMenuModel([root]);
    const childCopy = copies[0]?.items?.[0];
    childCopy?.command?.({ originalEvent: click, item: childCopy });

    expect(received).toHaveLength(1);
    expect(received[0]?.originalEvent).toBe(click);
    expect(received[0]?.item).toBe(child);
  });

  it('makes command the copy’s only function, and a command-less item has none', () => {
    const [withCommand, without] = _toOptimusMenuModel<AppItem>([
      { label: 'A', command: () => undefined },
      { label: 'B' },
    ]).items;

    const functions = (item: MenuItem | undefined): string[] =>
      Object.entries(item ?? {})
        .filter(([, value]) => typeof value === 'function')
        .map(([key]) => key);
    expect(functions(withCommand)).toEqual(['command']);
    expect(functions(without)).toEqual([]);
  });

  it('gives a disabled item no command, at any depth, and an enabled sibling keeps its own', () => {
    const { items } = _toOptimusMenuModel<AppItem>([
      {
        label: 'Parent',
        command: () => undefined,
        items: [
          { label: 'Off', disabled: true, command: () => undefined },
          { label: 'On', disabled: false, command: () => undefined },
        ],
      },
      { label: 'Off too', disabled: true, command: () => undefined },
    ]);

    const hasCommand = (item: MenuItem | undefined): boolean =>
      item !== undefined && 'command' in item;
    expect(hasCommand(items[0])).toBe(true);
    expect(hasCommand(items[0]?.items?.[0])).toBe(false);
    expect(hasCommand(items[0]?.items?.[1])).toBe(true);
    expect(hasCommand(items[1])).toBe(false);
  });

  it('lets an error from the app’s command reach the caller unchanged', () => {
    const boom = new Error('boom');
    const [copy] = _toOptimusMenuModel<AppItem>([
      {
        command: () => {
          throw boom;
        },
      },
    ]).items;

    expect(() => copy?.command?.({ originalEvent: click, item: copy })).toThrow(boom);
  });

  it('finds the app’s item from a copy at any depth, and nothing for a stranger', () => {
    const leaf: AppItem = { label: 'Leaf' };
    const root: AppItem = { label: 'Root', items: [{ label: 'Mid', items: [leaf] }] };

    const model = _toOptimusMenuModel([root]);

    expect(model.source(model.items[0] ?? {})).toBe(root);
    expect(model.source(model.items[0]?.items?.[0]?.items?.[0] ?? {})).toBe(leaf);
    expect(model.source({ label: 'Leaf' })).toBeUndefined();
  });

  it('keeps a lookup per call, so two models do not share copies', () => {
    const item: AppItem = { label: 'Same' };

    const first = _toOptimusMenuModel([item]);
    const second = _toOptimusMenuModel([item]);

    expect(first.items[0]).not.toBe(second.items[0]);
    expect(first.source(second.items[0] ?? {})).toBeUndefined();
  });

  it('does not change the app’s objects, even when Optimus writes to the copies', () => {
    const items: AppItem[] = [{ label: 'Panel', expanded: false, items: [{ label: 'Child' }] }];
    const before = structuredClone(items);

    const [copy] = _toOptimusMenuModel(items).items;
    if (copy) copy.expanded = true;
    if (copy?.items?.[0]) copy.items[0].label = 'Changed';

    expect(items).toEqual(before);
  });

  it('returns an empty model for no items', () => {
    expect(_toOptimusMenuModel<AppItem>([]).items).toEqual([]);
  });
});

/** A megamenu's own item types, wider than the shapes, as an app's might be. */
interface AppEntry extends _MenuItemShape<AppEntry> {
  id?: number;
}
interface AppRoot extends _MegaMenuItemShape<AppRoot, AppEntry> {
  id?: number;
}

describe('_toOptimusMegaMenuModel', () => {
  const map = (items: AppRoot[]): ReturnType<typeof _toOptimusMegaMenuModel<AppRoot, AppEntry>> =>
    _toOptimusMegaMenuModel<AppRoot, AppEntry>(items);

  it('copies the root items with the allow-list and escape: true, and nothing else', () => {
    const wider = { label: 'Docs', url: '/docs', escape: false, styleClass: 'x', id: 3 };
    const items: AppRoot[] = [wider];

    const [root] = map(items).items;

    expect(root).toStrictEqual({ escape: true, label: 'Docs', url: '/docs' });
  });

  it('turns items into columns of groups of entries, each with escape: true', () => {
    const { items } = map([
      {
        label: 'Components',
        items: [
          [{ label: 'Form', items: [{ label: 'Button' }, { separator: true }] }],
          [{ label: 'Data', items: [{ label: 'Table' }] }, { label: 'Menus' }],
        ],
      },
    ]);

    const [root] = items;
    expect(root).toHaveProperty('escape', true);
    expect(root?.items).toHaveLength(2);
    expect(root?.items?.[0]).toStrictEqual([
      {
        escape: true,
        label: 'Form',
        items: [
          { escape: true, label: 'Button' },
          { escape: true, separator: true },
        ],
      },
    ]);
    expect(root?.items?.[1]?.map((group) => group.label)).toEqual(['Data', 'Menus']);
    expect(root?.items?.[1]?.[0]?.items?.[0]).toStrictEqual({ escape: true, label: 'Table' });
  });

  it('never copies an escape: false or a style field at a group or an entry either', () => {
    const smuggled = { label: 'Entry', escape: false, styleClass: 'x', tooltipOptions: {} };
    const group = { label: 'Group', escape: false, items: [smuggled] };
    const [root] = map([{ label: 'Root', escape: false, items: [[group]] } as AppRoot]).items;

    expect(root).toStrictEqual({
      escape: true,
      label: 'Root',
      items: [[{ escape: true, label: 'Group', items: [{ escape: true, label: 'Entry' }] }]],
    });
  });

  it('wraps a root command, and a group’s and an entry’s, with the app’s own object', () => {
    const received: unknown[] = [];
    const click = new Event('click');
    const entry: AppEntry = {
      label: 'Entry',
      command: ({ item }) => {
        received.push(item);
      },
    };
    const root: AppRoot = {
      label: 'Root',
      command: ({ item }) => {
        received.push(item);
      },
      items: [[{ label: 'Group', items: [entry] }]],
    };

    const [copy] = map([root]).items;
    copy?.command?.({ originalEvent: click, item: copy });
    const entryCopy = copy?.items?.[0]?.[0]?.items?.[0];
    entryCopy?.command?.({ originalEvent: click, item: entryCopy });

    expect(received).toEqual([root, entry]);
    expect(received[0]).toBe(root);
    expect(received[1]).toBe(entry);
  });

  it('gives a disabled root item, and a disabled entry, no command', () => {
    const { items } = map([
      {
        label: 'Off',
        disabled: true,
        command: () => undefined,
        items: [
          [{ label: 'G', items: [{ label: 'E', disabled: true, command: () => undefined }] }],
        ],
      },
      { label: 'On', command: () => undefined },
    ]);

    expect('command' in (items[0] ?? {})).toBe(false);
    expect('command' in (items[0]?.items?.[0]?.[0]?.items?.[0] ?? {})).toBe(false);
    expect('command' in (items[1] ?? {})).toBe(true);
  });

  it('finds the app’s item from a copy at both levels, and nothing for a stranger', () => {
    const entry: AppEntry = { label: 'Entry' };
    const group: AppEntry = { label: 'Group', items: [entry] };
    const root: AppRoot = { label: 'Root', items: [[group]] };

    const model = map([root]);
    const rootCopy: MegaMenuItem | undefined = model.items[0];
    const groupCopy: MenuItem | undefined = rootCopy?.items?.[0]?.[0];

    expect(model.source(rootCopy ?? {})).toBe(root);
    expect(model.source(groupCopy ?? {})).toBe(group);
    expect(model.source(groupCopy?.items?.[0] ?? {})).toBe(entry);
    expect(model.source({ label: 'Entry' })).toBeUndefined();
  });

  it('does not change the app’s objects, even when Optimus writes to the copies', () => {
    const items: AppRoot[] = [
      { label: 'Root', expanded: false, items: [[{ label: 'G', items: [{ label: 'E' }] }]] },
    ];
    const before = structuredClone(items);

    const [copy] = map(items).items;
    if (copy) copy.expanded = true;
    const group = copy?.items?.[0]?.[0];
    if (group) group.label = 'Changed';

    expect(items).toEqual(before);
  });

  it('writes no key for a field a root item does not have, and returns an empty model for none', () => {
    const [root] = map([{ label: 'Root' }]).items;

    expect(Object.keys(root ?? {}).sort()).toEqual(['escape', 'label']);
    expect(map([]).items).toEqual([]);
  });
});
