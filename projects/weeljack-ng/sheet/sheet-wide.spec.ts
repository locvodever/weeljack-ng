/// <reference types="@vitest/browser-playwright" />
import { DOCUMENT, PLATFORM_ID, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { WJ_SHEET_WIDE } from './sheet-wide';

/** A stand-in for a `MediaQueryList`: it keeps its listeners and fires `change` on demand. */
class FakeQuery extends EventTarget {
  matches = false;

  set(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new MediaQueryListEvent('change', { matches }));
  }
}

/** A document whose window is `view`: a jsdom-like one (no `matchMedia`) or a controlled one. */
const stubDocument = (view: object): Provider => ({
  provide: DOCUMENT,
  useValue: { defaultView: view },
});

describe('WJ_SHEET_WIDE', () => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  afterEach(async () => {
    TestBed.resetTestingModule();
    await page.viewport(viewport.width, viewport.height);
  });

  it('is false on the server, and never asks for a media query there', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    expect(TestBed.inject(WJ_SHEET_WIDE)()).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('is false in a browser whose window has no matchMedia', () => {
    TestBed.configureTestingModule({ providers: [stubDocument({})] });

    expect(TestBed.inject(WJ_SHEET_WIDE)()).toBe(false);
  });

  it('is false when matchMedia is there but is not a function', () => {
    TestBed.configureTestingModule({ providers: [stubDocument({ matchMedia: 'nope' })] });

    expect(TestBed.inject(WJ_SHEET_WIDE)()).toBe(false);
  });

  it('is true at 768px and wider, and false below it', async () => {
    await page.viewport(768, 600);
    expect(TestBed.inject(WJ_SHEET_WIDE)()).toBe(true);
    TestBed.resetTestingModule();

    await page.viewport(767, 600);
    expect(TestBed.inject(WJ_SHEET_WIDE)()).toBe(false);
  });

  it('follows the viewport live', async () => {
    await page.viewport(600, 600);
    const wide = TestBed.inject(WJ_SHEET_WIDE);
    expect(wide()).toBe(false);

    await page.viewport(1000, 600);
    await expect.poll(wide).toBe(true);

    await page.viewport(500, 600);
    await expect.poll(wide).toBe(false);
  });

  it('asks for the 768px query, follows its change event and drops the listener with the injector', () => {
    const query = new FakeQuery();
    const matchMedia = vi.fn<(query: string) => FakeQuery>(() => query);
    const remove = vi.spyOn(query, 'removeEventListener');
    TestBed.configureTestingModule({ providers: [stubDocument({ matchMedia })] });

    const wide = TestBed.inject(WJ_SHEET_WIDE);
    expect(matchMedia).toHaveBeenCalledExactlyOnceWith('(min-width: 768px)');
    expect(wide()).toBe(false);

    query.set(true);
    expect(wide()).toBe(true);
    query.set(false);
    expect(wide()).toBe(false);

    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledExactlyOnceWith('change', expect.any(Function));
    query.set(true);
    expect(wide()).toBe(false);
  });
});
