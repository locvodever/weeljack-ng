import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { provideWeeljack } from 'weeljack-ng';
import {
  _CONFIRM_DIALOG_KEY,
  _CONFIRM_POPUP_KEY,
  _WJ_CONFIRMATIONS,
  _confirmationHosts,
  _registerConfirmationHost,
} from './confirmation';

/** A host that registers itself under a key, the way a confirm component does. */
@Component({ selector: 'wj-confirmation-registrar', template: `` })
class Registrar {
  constructor() {
    _registerConfirmationHost(_CONFIRM_DIALOG_KEY, 'wj-confirmdialog');
  }
}

describe('_WJ_CONFIRMATIONS', () => {
  it('is one Optimus ConfirmationService per application, created on first use', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(_WJ_CONFIRMATIONS);

    expect(service).toBeInstanceOf(ConfirmationService);
    expect(TestBed.inject(_WJ_CONFIRMATIONS)).toBe(service);
  });

  it('is a fresh one for the next application', () => {
    const first = TestBed.inject(_WJ_CONFIRMATIONS);
    TestBed.resetTestingModule();

    expect(TestBed.inject(_WJ_CONFIRMATIONS)).not.toBe(first);
  });
});

describe('the routing keys', () => {
  it('are two different internal strings', () => {
    expect(_CONFIRM_DIALOG_KEY).not.toBe(_CONFIRM_POPUP_KEY);
    expect(_CONFIRM_DIALOG_KEY).toBe('wj-confirmdialog');
    expect(_CONFIRM_POPUP_KEY).toBe('wj-confirmpopup');
  });
});

describe('host bookkeeping', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });
  });

  const count = (key: string): number => _confirmationHosts(TestBed.inject(_WJ_CONFIRMATIONS), key);

  it('counts the hosts of each kind while they are rendered, and forgets them when destroyed', () => {
    expect(count(_CONFIRM_DIALOG_KEY)).toBe(0);

    const first = TestBed.createComponent(Registrar);
    expect(count(_CONFIRM_DIALOG_KEY)).toBe(1);
    expect(count(_CONFIRM_POPUP_KEY)).toBe(0);

    const second = TestBed.createComponent(Registrar);
    expect(count(_CONFIRM_DIALOG_KEY)).toBe(2);

    first.destroy();
    second.destroy();
    expect(count(_CONFIRM_DIALOG_KEY)).toBe(0);
  });

  it('warns WJ0151 once, for the second host of a kind', () => {
    TestBed.createComponent(Registrar);
    expect(warn).not.toHaveBeenCalled();

    TestBed.createComponent(Registrar);
    TestBed.createComponent(Registrar);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'WJ0151: wj-confirmdialog: a second wj-confirmdialog is rendered, and every one opens each confirmation. ' +
        'Render one wj-confirmdialog at a time. ' +
        'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0151',
    );
  });

  it('keeps each application to its own count', () => {
    TestBed.createComponent(Registrar);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });

    expect(count(_CONFIRM_DIALOG_KEY)).toBe(0);
  });
});
