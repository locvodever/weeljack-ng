import { Component, ElementRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Translation } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';
import { _WJ_EN } from './translation-en';
import {
  _OVERLAY_MOTION,
  _focusIntoOverlay,
  _overlayCloseLabel,
  _overlayEscapeGate,
  _overlayLifecycle,
} from './overlay';

describe('_OVERLAY_MOTION', () => {
  it('is the motion options that respect reduced motion', () => {
    expect(_OVERLAY_MOTION).toEqual({ safe: true });
  });
});

describe('_overlayCloseLabel', () => {
  const withAria = (aria: NonNullable<Translation['aria']>): Translation => ({ ..._WJ_EN, aria });

  it('reads the translation aria.close', () => {
    TestBed.configureTestingModule({
      providers: [provideOptimus({ translation: withAria({ ..._WJ_EN.aria, close: 'Đóng' }) })],
    });

    expect(TestBed.runInInjectionContext(_overlayCloseLabel)).toBe('Đóng');
  });

  it('reads the English default', () => {
    TestBed.configureTestingModule({ providers: [provideOptimus({ translation: _WJ_EN })] });

    expect(TestBed.runInInjectionContext(_overlayCloseLabel)).toBe('Close');
  });

  it('falls back to English when aria.close is missing or empty', () => {
    for (const translation of [withAria({}), withAria({ close: '' }), {}]) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideOptimus({ translation })] });

      expect(TestBed.runInInjectionContext(_overlayCloseLabel)).toBe('Close');
    }
  });
});

describe('_focusIntoOverlay', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <div id="header"><button id="close">Close</button></div>
      <div id="body"><p>text</p></div>
      <div id="footer"><button id="cancel">Cancel</button></div>`;
    document.body.append(root);
  });

  afterEach(() => {
    root.remove();
  });

  const part = (id: string): HTMLElement => {
    const found = root.querySelector<HTMLElement>(`#${id}`);
    if (!found) {
      throw new Error(`#${id} is missing`);
    }
    return found;
  };
  const regions = (): HTMLElement[] => [part('body'), part('footer'), part('header')];

  it('focuses the first control of the first region that has one, in the order given', () => {
    part('body').innerHTML = '<input id="field" /><button id="other">Other</button>';
    _focusIntoOverlay(root, regions());
    expect(document.activeElement?.id).toBe('field');

    part('body').innerHTML = '<p>text</p>';
    _focusIntoOverlay(root, regions());
    expect(document.activeElement?.id).toBe('cancel');

    part('footer').innerHTML = '';
    _focusIntoOverlay(root, regions());
    expect(document.activeElement?.id).toBe('close');
  });

  it('skips what the keyboard cannot reach: disabled, tabindex -1, hidden', () => {
    part('body').innerHTML = `
      <button disabled>Disabled</button>
      <input type="hidden" />
      <button tabindex="-1">Not in the order</button>
      <button style="display: none">Hidden</button>
      <a id="link" href="#x">Link</a>`;
    _focusIntoOverlay(root, regions());

    expect(document.activeElement?.id).toBe('link');
  });

  it('takes an ElementRef, and skips a region that is not rendered', () => {
    _focusIntoOverlay(root, [null, undefined, new ElementRef(part('footer'))]);

    expect(document.activeElement?.id).toBe('cancel');
  });

  it('focuses the root, given tabindex -1, when no region has a control', () => {
    part('footer').innerHTML = '';
    part('header').innerHTML = '';
    _focusIntoOverlay(root, regions());

    expect(document.activeElement).toBe(root);
    expect(root.getAttribute('tabindex')).toBe('-1');
  });

  it('keeps a tabindex the root already has', () => {
    root.setAttribute('tabindex', '0');
    part('footer').innerHTML = '';
    part('header').innerHTML = '';
    _focusIntoOverlay(root, regions());

    expect(root.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(root);
  });

  it('does nothing without a root', () => {
    part('cancel').focus();
    _focusIntoOverlay(null, regions());
    _focusIntoOverlay(undefined, regions());

    expect(document.activeElement?.id).toBe('cancel');
  });
});

describe('_overlayLifecycle', () => {
  let opener: HTMLButtonElement;
  let elsewhere: HTMLButtonElement;
  const visible = signal(false);
  const closed = vi.fn<() => void>();

  beforeEach(() => {
    opener = document.createElement('button');
    elsewhere = document.createElement('button');
    document.body.append(opener, elsewhere);
    visible.set(false);
  });

  afterEach(() => {
    opener.remove();
    elsewhere.remove();
  });

  function start(): ReturnType<typeof _overlayLifecycle> {
    const lifecycle = TestBed.runInInjectionContext(() => _overlayLifecycle(visible, closed));
    TestBed.tick();
    return lifecycle;
  }

  /** Opens the way an app does: the opener has focus, then `visible` turns true. */
  function openFrom(element: HTMLElement): void {
    element.focus();
    visible.set(true);
    TestBed.tick();
  }

  it('returns focus to the opener and calls closed once per close', () => {
    const lifecycle = start();
    openFrom(opener);
    elsewhere.focus();
    visible.set(false);
    TestBed.tick();

    lifecycle.left();
    expect(document.activeElement).toBe(opener);
    expect(closed).toHaveBeenCalledTimes(1);

    lifecycle.left();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('restores focus before it calls closed, so a closed handler can move it', () => {
    const lifecycle = start();
    closed.mockImplementationOnce(() => {
      expect(document.activeElement).toBe(opener);
      elsewhere.focus();
    });
    openFrom(opener);
    lifecycle.left();

    expect(document.activeElement).toBe(elsewhere);
  });

  it('calls closed for every open, each with its own opener', () => {
    const lifecycle = start();
    openFrom(opener);
    lifecycle.left();
    visible.set(false);
    TestBed.tick();

    openFrom(elsewhere);
    opener.focus();
    lifecycle.left();

    expect(document.activeElement).toBe(elsewhere);
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it('does nothing for a leave that no open came before', () => {
    const lifecycle = start();
    lifecycle.left();

    expect(closed).not.toHaveBeenCalled();
  });

  it('keeps the original opener when the overlay is reopened before it has left', () => {
    const lifecycle = start();
    openFrom(opener);
    visible.set(false);
    TestBed.tick();
    openFrom(elsewhere);
    lifecycle.left();

    expect(document.activeElement).toBe(opener);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('still calls closed when the opener is gone, and moves no focus', () => {
    const lifecycle = start();
    openFrom(opener);
    opener.remove();
    elsewhere.focus();
    lifecycle.left();

    expect(document.activeElement).toBe(elsewhere);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('remembers no opener when nothing but the page had focus', () => {
    const lifecycle = start();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    visible.set(true);
    TestBed.tick();
    elsewhere.focus();
    lifecycle.left();

    expect(document.activeElement).toBe(elsewhere);
    expect(closed).toHaveBeenCalledTimes(1);
  });
});

/** A component that holds the gate: the overlay's host, with a control in it. */
@Component({
  selector: 'wj-escape-gate-host',
  template: `<input id="inside" />`,
})
class GateHost {
  readonly open = signal(true);
  readonly closable = signal(false);

  constructor() {
    _overlayEscapeGate(this.open, this.closable);
  }
}

describe('_overlayEscapeGate', () => {
  const reachedDocument = vi.fn<(event: KeyboardEvent) => void>();
  const reachedInput = vi.fn<(event: KeyboardEvent) => void>();
  let outside: HTMLButtonElement;

  beforeEach(() => {
    document.addEventListener('keydown', reachedDocument);
    outside = document.createElement('button');
    document.body.append(outside);
  });

  afterEach(() => {
    document.removeEventListener('keydown', reachedDocument);
    outside.remove();
  });

  async function render(): Promise<{ host: GateHost; input: HTMLInputElement }> {
    const fixture = TestBed.createComponent(GateHost);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input');
    if (!input) {
      throw new Error('the input is missing');
    }
    input.addEventListener('keydown', reachedInput);
    return { host: fixture.componentInstance, input };
  }

  const press = (target: EventTarget, key = 'Escape'): void => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  };

  it('lets a control inside the host handle Escape, and stops it before the document', async () => {
    const { input } = await render();
    press(input);

    expect(reachedInput).toHaveBeenCalledTimes(1);
    expect(reachedDocument).not.toHaveBeenCalled();
  });

  it('stops Escape with focus on the page', async () => {
    await render();
    press(document.body);
    press(document.documentElement);

    expect(reachedDocument).not.toHaveBeenCalled();
  });

  it('leaves Escape alone while closable, while closed, and for any other key', async () => {
    const { host, input } = await render();

    host.closable.set(true);
    press(input);
    press(document.body);
    expect(reachedDocument).toHaveBeenCalledTimes(2);

    host.closable.set(false);
    host.open.set(false);
    press(input);
    press(document.body);
    expect(reachedDocument).toHaveBeenCalledTimes(4);

    host.open.set(true);
    press(input, 'a');
    press(document.body, 'Enter');
    expect(reachedDocument).toHaveBeenCalledTimes(6);
  });

  it('leaves Escape in another element of the page alone, such as a stacked overlay', async () => {
    await render();
    press(outside);

    expect(reachedDocument).toHaveBeenCalledTimes(1);
  });

  it('removes its listeners when the host is destroyed', async () => {
    const fixture = TestBed.createComponent(GateHost);
    await fixture.whenStable();
    fixture.destroy();
    press(document.body);

    expect(reachedDocument).toHaveBeenCalledTimes(1);
  });
});
