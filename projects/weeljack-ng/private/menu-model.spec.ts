import type { MenuItem } from '@openng/optimus-ui/api';
import { _toOptimusMenuModel, type _MenuItemShape } from './menu-model';

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
