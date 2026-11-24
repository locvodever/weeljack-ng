import { _ptContextFlag } from './pt-context';

describe('_ptContextFlag', () => {
  it('is true only when context[key] is exactly true', () => {
    const options = { context: { disabled: true, active: false, level: 1, optionGroup: 'yes' } };

    expect(_ptContextFlag(options, 'disabled')).toBe(true);
    expect(_ptContextFlag(options, 'active')).toBe(false);
    expect(_ptContextFlag(options, 'level')).toBe(false);
    expect(_ptContextFlag(options, 'optionGroup')).toBe(false);
    expect(_ptContextFlag(options, 'missing')).toBe(false);
  });

  it('reads each flag independently', () => {
    const options = { context: { disabled: false, optionGroup: true, active: true } };

    expect([
      _ptContextFlag(options, 'disabled'),
      _ptContextFlag(options, 'optionGroup'),
      _ptContextFlag(options, 'active'),
    ]).toEqual([false, true, true]);
  });

  it('is false for anything that is not an object with a context', () => {
    for (const options of [undefined, null, 0, 'context', true, {}, { context: null }]) {
      expect(_ptContextFlag(options, 'disabled')).toBe(false);
    }
    expect(_ptContextFlag({ context: 'disabled' }, 'disabled')).toBe(false);
    expect(_ptContextFlag({ context: [] }, 'length')).toBe(false);
  });

  it('does not look at the options object itself, only at its context', () => {
    expect(_ptContextFlag({ disabled: true }, 'disabled')).toBe(false);
    expect(_ptContextFlag({ instance: { disabled: true }, context: {} }, 'disabled')).toBe(false);
  });

  it('survives a context getter that returns true, and a prototype-borne flag', () => {
    const context = Object.create({ active: true }) as object;
    Object.defineProperty(context, 'disabled', { get: () => true });

    expect(_ptContextFlag({ context }, 'disabled')).toBe(true);
    expect(_ptContextFlag({ context }, 'active')).toBe(true);
  });
});
