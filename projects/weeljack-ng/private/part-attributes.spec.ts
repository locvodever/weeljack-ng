import { _mergePartAttributes } from './part-attributes';

type Parts = Record<string, unknown>;
const context = { instance: 'ctx' };

describe('_mergePartAttributes', () => {
  it('sets the routed attributes on the part when there is no pt', () => {
    const merged = _mergePartAttributes<unknown, Parts>(undefined, 'root', { 'aria-busy': 'true' });

    expect(merged(context)).toEqual({ root: { 'aria-busy': 'true' } });
  });

  it('omits undefined and null attributes', () => {
    const merged = _mergePartAttributes<unknown, Parts>(null, 'root', {
      a: undefined,
      b: null,
      c: 'x',
    });

    expect(merged(context)).toEqual({ root: { c: 'x' } });
  });

  it('keeps every key of an object pt', () => {
    const pt: Parts = { root: { class: 'mine', id: 'r' }, label: { class: 'l' } };

    const merged = _mergePartAttributes(pt, 'root', { 'aria-label': 'Go' });

    expect(merged(context)).toEqual({
      root: { class: 'mine', id: 'r', 'aria-label': 'Go' },
      label: { class: 'l' },
    });
    expect(pt['root']).toEqual({ class: 'mine', id: 'r' });
  });

  it('resolves a function pt and a function part with the context', () => {
    const merged = _mergePartAttributes<unknown, Parts>(
      () => ({ root: () => ({ id: 'from-fn' }), icon: { class: 'i' } }),
      'root',
      { role: 'button' },
    );

    expect(merged(context)).toEqual({
      root: { id: 'from-fn', role: 'button' },
      icon: { class: 'i' },
    });
  });

  it('turns a string part into a class and keeps it', () => {
    const merged = _mergePartAttributes<unknown, Parts>({ root: 'a b' }, 'root', { role: 'x' });

    expect(merged(context)).toEqual({ root: { class: 'a b', role: 'x' } });
  });

  it('follows a dotted path and keeps its siblings', () => {
    const pt: Parts = { pcInputText: { root: { class: 'c' }, other: { id: 'o' } }, root: 'r' };

    const merged = _mergePartAttributes(pt, 'pcInputText.root', { 'aria-label': 'L' });

    expect(merged(context)).toEqual({
      pcInputText: { root: { class: 'c', 'aria-label': 'L' }, other: { id: 'o' } },
      root: 'r',
    });
  });

  it('lets a routed attribute win over the consumer attribute of the same name', () => {
    const merged = _mergePartAttributes<unknown, Parts>(
      { root: { 'aria-label': 'consumer', title: 'kept' } },
      'root',
      { 'aria-label': 'routed' },
    );

    expect(merged(context)).toEqual({ root: { 'aria-label': 'routed', title: 'kept' } });
  });

  it('keeps the consumer attribute when the routed one is undefined', () => {
    const merged = _mergePartAttributes<unknown, Parts>(
      { root: { 'aria-label': 'consumer' } },
      'root',
      { 'aria-label': undefined },
    );

    expect(merged(context)).toEqual({ root: { 'aria-label': 'consumer' } });
  });
});
