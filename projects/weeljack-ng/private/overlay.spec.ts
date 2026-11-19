import { Component, ElementRef, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { Translation } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';
import { _WJ_EN } from './translation-en';
import {
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _drawerPassThrough,
  _focusIntoOverlay,
  _overlayCloseLabel,
  _overlayEscapeGate,
  _overlayFocusTarget,
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

describe('_overlayLifecycle, Safari and anchors', () => {
  let opener: HTMLButtonElement;
  let elsewhere: HTMLButtonElement;
  const visible = signal(false);
  const closed = vi.fn<() => void>();

  beforeEach(() => {
    opener = document.createElement('button');
    elsewhere = document.createElement('button');
    document.body.append(opener, elsewhere);
    visible.set(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  afterEach(() => {
    opener.remove();
    elsewhere.remove();
    document.body.classList.remove('p-overflow-hidden');
  });

  function start(anchor?: () => unknown): ReturnType<typeof _overlayLifecycle> {
    const lifecycle = TestBed.runInInjectionContext(() =>
      _overlayLifecycle(visible, closed, anchor),
    );
    TestBed.tick();
    return lifecycle;
  }

  /** A press that leaves focus where it was, as Safari's does on a button. */
  const pressWithoutFocus = (target: Element): void => {
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  };

  const open = (): void => {
    visible.set(true);
    TestBed.tick();
  };

  it('returns focus to the pressed opener when the page had focus at open time (Safari)', () => {
    const lifecycle = start();
    pressWithoutFocus(opener);
    open();
    expect(document.activeElement).toBe(document.body);

    lifecycle.left();

    expect(document.activeElement).toBe(opener);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('takes the nearest focusable ancestor of the pressed element', () => {
    const lifecycle = start();
    const card = document.createElement('div');
    card.tabIndex = 0;
    card.innerHTML = '<span>inner</span>';
    document.body.append(card);
    pressWithoutFocus(card.querySelector('span') ?? card);
    open();
    lifecycle.left();

    expect(document.activeElement).toBe(card);
    card.remove();
  });

  it('restores focus before it calls closed in Safari too', () => {
    const lifecycle = start();
    closed.mockImplementationOnce(() => {
      expect(document.activeElement).toBe(opener);
    });
    pressWithoutFocus(opener);
    open();
    lifecycle.left();

    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('prefers the element that has focus over the pressed one', () => {
    const lifecycle = start();
    pressWithoutFocus(opener);
    elsewhere.focus();
    open();
    opener.focus();
    lifecycle.left();

    expect(document.activeElement).toBe(elsewhere);
  });

  it('forgets a press once focus has moved since, and one that landed on nothing focusable', () => {
    const lifecycle = start();
    pressWithoutFocus(opener);
    elsewhere.focus();
    elsewhere.blur();
    open();
    lifecycle.left();
    expect(document.activeElement).toBe(document.body);

    visible.set(false);
    TestBed.tick();
    pressWithoutFocus(document.body);
    open();
    lifecycle.left();
    expect(document.activeElement).toBe(document.body);
  });

  it('does not restore focus to a pressed opener that has left the document', () => {
    const lifecycle = start();
    pressWithoutFocus(opener);
    open();
    opener.remove();
    lifecycle.left();

    expect(document.activeElement).toBe(document.body);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the anchor first: itself if focusable, else its first focusable descendant', () => {
    const anchor = document.createElement('div');
    anchor.innerHTML = '<span>label</span><button id="inner">Inner</button>';
    document.body.append(anchor);
    const lifecycle = start(() => anchor);
    opener.focus();
    open();
    lifecycle.left();
    expect(document.activeElement?.id).toBe('inner');

    visible.set(false);
    TestBed.tick();
    anchor.tabIndex = 0;
    opener.focus();
    open();
    lifecycle.left();
    expect(document.activeElement).toBe(anchor);
    anchor.remove();
  });

  it('falls back to the opener when the anchor has nothing focusable, or is gone', () => {
    const anchor = document.createElement('div');
    document.body.append(anchor);
    const lifecycle = start(() => anchor);
    opener.focus();
    open();
    elsewhere.focus();
    lifecycle.left();
    expect(document.activeElement).toBe(opener);

    visible.set(false);
    TestBed.tick();
    anchor.innerHTML = '<button>Inner</button>';
    opener.focus();
    open();
    anchor.remove();
    elsewhere.focus();
    lifecycle.left();
    expect(document.activeElement).toBe(opener);
  });

  it('puts the scroll lock back when another modal still has its mask up', async () => {
    const lifecycle = start();
    const lower = document.createElement('div');
    lower.setAttribute('data-p-scrollblocker-active', 'true');
    document.body.append(lower);
    open();
    lifecycle.left();
    await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(true);
    lower.remove();
  });

  it('leaves the lock off when no modal remains', async () => {
    const lifecycle = start();
    open();
    lifecycle.left();
    TestBed.tick();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });

    expect(document.body.classList.contains('p-overflow-hidden')).toBe(false);
  });
});

describe('_overlayFocusTarget', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML =
      '<span id="plain">x</span><div id="host"><i></i><a id="link" href="#a">a</a></div>';
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

  it('is the target when it can take focus', () => {
    expect(_overlayFocusTarget(part('link'))).toBe(part('link'));
  });

  it('is the first focusable descendant otherwise, from an element or an ElementRef', () => {
    expect(_overlayFocusTarget(part('host'))).toBe(part('link'));
    expect(_overlayFocusTarget(new ElementRef(part('host')))).toBe(part('link'));
  });

  it('is null when nothing in it can take focus, and for anything that is not an element', () => {
    expect(_overlayFocusTarget(part('plain'))).toBeNull();
    expect(_overlayFocusTarget(null)).toBeNull();
    expect(_overlayFocusTarget(undefined)).toBeNull();
    expect(_overlayFocusTarget({})).toBeNull();
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

  describe('stacked overlays', () => {
    /** The roots a spec attached, so the next one starts without them. */
    const attached: HTMLElement[] = [];

    afterEach(() => {
      for (const element of attached.splice(0)) {
        element.remove();
      }
    });

    interface Stacked {
      host: GateHost;
      input: HTMLInputElement;
      element: HTMLElement;
      fixture: ComponentFixture<GateHost>;
    }

    /** Renders a host. One given a `parent` is moved into it, so its Escape passes through it. */
    async function stacked(options: { closable: boolean; parent?: HTMLElement }): Promise<Stacked> {
      const fixture = TestBed.createComponent(GateHost);
      fixture.componentInstance.closable.set(options.closable);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      // TestBed removes every earlier `#root<n>` element when it creates the next fixture.
      element.removeAttribute('id');
      (options.parent ?? document.body).append(element);
      attached.push(element);
      const input = element.querySelector('input');
      if (!input) {
        throw new Error('the input is missing');
      }
      return { host: fixture.componentInstance, input, element, fixture };
    }

    it('lets Escape through a non-closable overlay while a closable one is open above it', async () => {
      const lower = await stacked({ closable: false });
      const upper = await stacked({ closable: true, parent: lower.element });

      press(upper.input);
      press(lower.input);
      press(document.body);

      expect(reachedDocument).toHaveBeenCalledTimes(3);
    });

    it('blocks Escape again, from all three places, once the upper overlay has closed', async () => {
      const lower = await stacked({ closable: false });
      const upper = await stacked({ closable: true, parent: lower.element });
      upper.host.open.set(false);
      await upper.fixture.whenStable();

      press(upper.input);
      press(lower.input);
      press(document.body);

      expect(reachedDocument).not.toHaveBeenCalled();
    });

    it('blocks again once the upper overlay is destroyed while open', async () => {
      const lower = await stacked({ closable: false });
      const upper = await stacked({ closable: true, parent: lower.element });
      upper.fixture.destroy();

      press(lower.input);
      press(document.body);

      expect(reachedDocument).not.toHaveBeenCalled();
    });

    it('keeps blocking while the overlay above is non-closable too, and after it closes', async () => {
      const lower = await stacked({ closable: false });
      const upper = await stacked({ closable: false, parent: lower.element });

      press(upper.input);
      expect(reachedDocument).not.toHaveBeenCalled();

      upper.host.open.set(false);
      await upper.fixture.whenStable();
      press(lower.input);
      expect(reachedDocument).not.toHaveBeenCalled();
    });

    it('keeps the order of the rest when a middle overlay closes', async () => {
      const lower = await stacked({ closable: false });
      const middle = await stacked({ closable: false, parent: lower.element });
      const upper = await stacked({ closable: true, parent: middle.element });

      middle.host.open.set(false);
      await middle.fixture.whenStable();
      press(upper.input);
      expect(reachedDocument).toHaveBeenCalledTimes(1);

      upper.host.open.set(false);
      await upper.fixture.whenStable();
      press(lower.input);
      press(document.body);
      expect(reachedDocument).toHaveBeenCalledTimes(1);
    });

    it('joins with an always-true closable, which only adds it to the stack', async () => {
      const lower = await stacked({ closable: false });
      const top = await stacked({ closable: true });

      press(document.body);
      expect(reachedDocument).toHaveBeenCalledTimes(1);

      top.host.open.set(false);
      await top.fixture.whenStable();
      press(document.body);
      expect(reachedDocument).toHaveBeenCalledTimes(1);
      expect(lower.host.open()).toBe(true);
    });
  });
});

describe('_OVERLAY_CLOSE_BUTTON', () => {
  it('is the default close button without autofocus', () => {
    expect(_OVERLAY_CLOSE_BUTTON).toEqual({
      severity: 'secondary',
      variant: 'text',
      rounded: true,
      autofocus: false,
    });
  });
});

describe('_drawerPassThrough', () => {
  const resolve = (pt: ReturnType<typeof _drawerPassThrough>): Record<string, unknown> =>
    // type-escape: the merged bag is read back by key; its Optimus type is not what is under test
    pt(undefined) as unknown as Record<string, unknown>;

  it('makes the root a modal dialog named by the title, and gives the title the id', () => {
    const pt = resolve(_drawerPassThrough({}, 'wj-drawer-title-1', 'about'));

    expect(pt['root']).toEqual({
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'wj-drawer-title-1',
      'aria-describedby': 'about',
    });
    expect(pt['title']).toEqual({ id: 'wj-drawer-title-1' });
  });

  it('clears the description when there is none, and keeps the consumer pt', () => {
    const pt = resolve(
      _drawerPassThrough(
        { root: { 'data-root': 'r', role: 'region' }, content: { class: 'c' } },
        'wj-drawer-title-2',
        undefined,
      ),
    );

    expect(pt['root']).toEqual({
      'data-root': 'r',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'wj-drawer-title-2',
      'aria-describedby': undefined,
    });
    expect(pt['content']).toEqual({ class: 'c' });
  });

  it('takes the function form of pt', () => {
    const pt = resolve(
      _drawerPassThrough(() => ({ title: { class: 't' } }), 'wj-drawer-title-3', ''),
    );

    expect(pt['title']).toEqual({ class: 't', id: 'wj-drawer-title-3' });
  });
});
