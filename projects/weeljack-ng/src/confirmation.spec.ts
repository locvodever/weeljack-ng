/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Injector, inject, runInInjectionContext } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ConfirmationService, type Confirmation } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { WjConfirmationService, provideWeeljack, type WjConfirmation } from 'weeljack-ng';
import { WjConfirmDialog } from 'weeljack-ng/confirmdialog';
import { WjConfirmDialogHarness } from 'weeljack-ng/confirmdialog/testing';
import { WjConfirmPopup } from 'weeljack-ng/confirmpopup';
import { WjConfirmPopupHarness } from 'weeljack-ng/confirmpopup/testing';
import { _CONFIRM_DIALOG_KEY, _CONFIRM_POPUP_KEY, _WJ_CONFIRMATIONS } from 'weeljack-ng/private';

/** The app shell: one `wj-confirmdialog`, and nothing else provided. */
@Component({
  selector: 'wj-confirmation-shell',
  imports: [WjConfirmDialog],
  template: `<wj-confirmdialog />`,
})
class Shell {
  readonly service = inject(WjConfirmationService);
}

/** The app shell with both hosts, and a button for a popup's `target`. */
@Component({
  selector: 'wj-confirmation-both-shell',
  imports: [WjConfirmDialog, WjConfirmPopup],
  template: `<button id="anchor" type="button">Remove</button
    ><wj-confirmdialog /><wj-confirmpopup />`,
})
class BothShell {
  readonly service = inject(WjConfirmationService);
}

/** A shell with no host at all. */
@Component({ selector: 'wj-confirmation-empty-shell', template: `<p>No host.</p>` })
class EmptyShell {}

const dialogEl = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('div[role="alertdialog"]');

const realMatchMedia = window.matchMedia.bind(window);

/** Reduced motion for this window only, so an open or a close ends at once. */
function reduceMotion(): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? true : value;
          },
        })
      : list;
  });
}

async function render(): Promise<ComponentFixture<Shell>> {
  TestBed.configureTestingModule({ providers: [provideWeeljack()] });
  const fixture = TestBed.createComponent(Shell);
  await fixture.whenStable();
  return fixture;
}

async function gone(): Promise<void> {
  await expect.poll(() => document.querySelector('.p-dialog-mask')).toBeNull();
  await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
}

/** Closes what a spec left open, so the next spec starts without its panel or scroll lock. */
async function closeAll(fixture: ComponentFixture<Shell>): Promise<void> {
  fixture.componentInstance.service.close();
  await fixture.whenStable();
  await gone();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjConfirmDialogHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjConfirmDialogHarness);

describe('WjConfirmationService', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion();
  });

  it('injects with only provideWeeljack()', () => {
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });

    expect(TestBed.inject(WjConfirmationService)).toBeInstanceOf(WjConfirmationService);
  });

  it('asks the app to provide no Optimus service: the token holds the one instance', () => {
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });

    expect(TestBed.inject(ConfirmationService, null, { optional: true })).toBeNull();
    expect(TestBed.inject(_WJ_CONFIRMATIONS)).toBeInstanceOf(ConfirmationService);
  });

  it('opens the rendered confirm dialog, and a harness reads it', async () => {
    const fixture = await render();
    fixture.componentInstance.service.confirm({ message: 'Delete report.pdf?', header: 'Delete?' });
    await fixture.whenStable();
    await expect.poll(dialogEl).not.toBeNull();
    const harness = await harnessOf(fixture);

    expect(await harness.getHeader()).toBe('Delete?');
    expect(await harness.getMessage()).toBe('Delete report.pdf?');
    await closeAll(fixture);
  });

  it('hands Optimus only the fields of WjConfirmation, and its routing key', async () => {
    const fixture = await render();
    const token = TestBed.inject(_WJ_CONFIRMATIONS);
    // A copy taken at the call: Optimus's own host adds `acceptEvent` and `rejectEvent` afterwards.
    const sent: Confirmation[] = [];
    vi.spyOn(token, 'confirm').mockImplementation((confirmation) => {
      sent.push({ ...confirmation });
      return token;
    });
    const wide = {
      message: 'Sure?',
      header: 'Header',
      acceptLabel: 'Yes please',
      rejectLabel: 'No thanks',
      accept: vi.fn<() => void>(),
      reject: vi.fn<() => void>(),
      icon: 'pi pi-trash',
      acceptIcon: 'pi pi-check',
      key: 'mine',
      acceptButtonStyleClass: 'danger',
      defaultFocus: 'accept',
      closeOnEscape: false,
      position: 'top',
    };

    fixture.componentInstance.service.confirm(wide);

    expect(sent).toHaveLength(1);
    expect(Object.keys(sent[0] ?? {}).sort()).toEqual(
      ['accept', 'acceptLabel', 'header', 'key', 'message', 'reject', 'rejectLabel'].sort(),
    );
    expect(sent[0]?.key).toBe(_CONFIRM_DIALOG_KEY);
    expect(sent[0]?.message).toBe('Sure?');
  });

  it('leaves out every optional field it was not given', async () => {
    const fixture = await render();
    const confirm = vi.spyOn(TestBed.inject(_WJ_CONFIRMATIONS), 'confirm');

    fixture.componentInstance.service.confirm({ message: 'Sure?' });
    await fixture.whenStable();

    expect(confirm.mock.calls[0]?.[0]).toEqual({ message: 'Sure?', key: _CONFIRM_DIALOG_KEY });
    await closeAll(fixture);
  });

  it('routes a confirmation with a target to the popup key, and one without to the dialog key', async () => {
    const fixture = await render();
    const confirm = vi.spyOn(TestBed.inject(_WJ_CONFIRMATIONS), 'confirm');
    const target = document.createElement('button');

    fixture.componentInstance.service.confirm({ message: 'Remove?', target });
    fixture.componentInstance.service.confirm({ message: 'Delete?' });
    await fixture.whenStable();

    expect(confirm.mock.calls[0]?.[0].key).toBe(_CONFIRM_POPUP_KEY);
    expect(confirm.mock.calls[0]?.[0].target).toBe(target);
    expect(confirm.mock.calls[1]?.[0].key).toBe(_CONFIRM_DIALOG_KEY);
    expect(confirm.mock.calls[1]?.[0]).not.toHaveProperty('target');
    await closeAll(fixture);
  });

  it('opens a confirmation with a target in no dialog', async () => {
    const fixture = await render();
    fixture.componentInstance.service.confirm({ message: 'Remove?', target: document.body });
    await fixture.whenStable();

    expect(dialogEl()).toBeNull();
  });

  describe('with a dialog and a popup rendered', () => {
    const popupEl = (): HTMLElement | null =>
      document.querySelector<HTMLElement>('div[role="alertdialog"][data-wj-confirmpopup]');
    const dialogOnly = (): HTMLElement | null =>
      document.querySelector<HTMLElement>('div[role="alertdialog"]:not([data-wj-confirmpopup])');

    function anchorOf(fixture: ComponentFixture<BothShell>): HTMLElement {
      const anchor = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#anchor');
      if (!anchor) {
        throw new Error('#anchor is missing');
      }
      return anchor;
    }

    async function renderBoth(): Promise<ComponentFixture<BothShell>> {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BothShell);
      await fixture.whenStable();
      return fixture;
    }

    async function closeBoth(fixture: ComponentFixture<BothShell>): Promise<void> {
      fixture.componentInstance.service.close();
      await fixture.whenStable();
      await gone();
      await expect.poll(popupEl).toBeNull();
    }

    it('opens only the dialog for a confirmation with no target', async () => {
      const fixture = await renderBoth();
      fixture.componentInstance.service.confirm({ message: 'Delete?' });
      await fixture.whenStable();
      await expect.poll(dialogOnly).not.toBeNull();

      expect(popupEl()).toBeNull();
      expect(warn).not.toHaveBeenCalled();
      await closeBoth(fixture);
    });

    it('opens only the popup for a confirmation with a target, and a harness reads it', async () => {
      const fixture = await renderBoth();
      fixture.componentInstance.service.confirm({ message: 'Remove?', target: anchorOf(fixture) });
      await fixture.whenStable();
      await expect.poll(popupEl).not.toBeNull();
      const harness =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjConfirmPopupHarness);

      expect(dialogOnly()).toBeNull();
      expect(document.querySelector('.p-dialog-mask')).toBeNull();
      expect(await harness.getMessage()).toBe('Remove?');
      expect(warn).not.toHaveBeenCalled();
      await closeBoth(fixture);
    });

    it('opens one, then the other, as each confirmation asks', async () => {
      const fixture = await renderBoth();
      const service = fixture.componentInstance.service;
      service.confirm({ message: 'Remove?', target: anchorOf(fixture) });
      await fixture.whenStable();
      await expect.poll(popupEl).not.toBeNull();
      await closeBoth(fixture);

      service.confirm({ message: 'Delete?' });
      await fixture.whenStable();
      await expect.poll(dialogOnly).not.toBeNull();

      expect(popupEl()).toBeNull();
      await closeBoth(fixture);
    });
  });

  describe('callbacks', () => {
    async function ask(
      choose: (harness: WjConfirmDialogHarness) => Promise<void>,
    ): Promise<{ accept: MockInstance<() => void>; reject: MockInstance<() => void> }> {
      const fixture = await render();
      const accept = vi.fn<() => void>();
      const reject = vi.fn<() => void>();
      const confirmation: WjConfirmation = { message: 'Sure?', accept, reject };
      fixture.componentInstance.service.confirm(confirmation);
      await fixture.whenStable();
      await expect.poll(dialogEl).not.toBeNull();
      await choose(await harnessOf(fixture));
      await gone();
      return { accept, reject };
    }

    it('runs accept once, with no arguments, and not reject', async () => {
      const { accept, reject } = await ask((harness) => harness.accept());

      expect(accept).toHaveBeenCalledExactlyOnceWith();
      expect(reject).not.toHaveBeenCalled();
    });

    it('runs reject once, with no arguments, for Reject, the close button and Escape', async () => {
      for (const choose of [
        (harness: WjConfirmDialogHarness) => harness.reject(),
        (harness: WjConfirmDialogHarness) => harness.close(),
        (harness: WjConfirmDialogHarness) => harness.cancel(),
      ]) {
        TestBed.resetTestingModule();
        reduceMotion();
        const { accept, reject } = await ask(choose);

        expect(reject).toHaveBeenCalledExactlyOnceWith();
        expect(accept).not.toHaveBeenCalled();
      }
    });

    it('close() runs neither', async () => {
      const fixture = await render();
      const accept = vi.fn<() => void>();
      const reject = vi.fn<() => void>();
      fixture.componentInstance.service.confirm({ message: 'Sure?', accept, reject });
      await fixture.whenStable();
      await expect.poll(dialogEl).not.toBeNull();

      fixture.componentInstance.service.close();
      await fixture.whenStable();
      await gone();

      expect(accept).not.toHaveBeenCalled();
      expect(reject).not.toHaveBeenCalled();
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0150 once when confirm() runs with no dialog rendered', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      TestBed.createComponent(EmptyShell);
      const service = TestBed.inject(WjConfirmationService);

      service.confirm({ message: 'Sure?' });
      service.confirm({ message: 'Again?' });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0150: WjConfirmationService: confirm() was called with no wj-confirmdialog rendered, so the confirmation was dropped. ' +
          'Render one wj-confirmdialog in your app shell. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0150',
      );
    });

    it('warns WJ0150 for a confirmation with a target when no popup is rendered', async () => {
      const fixture = await render();
      fixture.componentInstance.service.confirm({ message: 'Remove?', target: document.body });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain('wj-confirmpopup');
    });

    it('stays silent when a dialog is rendered', async () => {
      const fixture = await render();
      fixture.componentInstance.service.confirm({ message: 'Sure?' });
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
      await closeAll(fixture);
    });

    it('warns again for a dialog that was destroyed', async () => {
      const fixture = await render();
      const service = fixture.componentInstance.service;
      fixture.destroy();

      service.confirm({ message: 'Sure?' });

      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('as an app spies on it', () => {
    it('is replaceable with vi.spyOn on the injected service', async () => {
      const fixture = await render();
      const spy = vi
        .spyOn(TestBed.inject(WjConfirmationService), 'confirm')
        .mockImplementation(() => undefined);

      fixture.componentInstance.service.confirm({ message: 'Sure?' });

      expect(spy).toHaveBeenCalledExactlyOnceWith({ message: 'Sure?' });
      expect(dialogEl()).toBeNull();
    });
  });

  describe('per application', () => {
    it('gives a second TestBed its own service and token instance', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const service = TestBed.inject(WjConfirmationService);
      const token = TestBed.inject(_WJ_CONFIRMATIONS);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });

      expect(TestBed.inject(WjConfirmationService)).not.toBe(service);
      expect(TestBed.inject(_WJ_CONFIRMATIONS)).not.toBe(token);
    });

    it('runs from an injector of its own application, outside any component', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const injector = TestBed.inject(Injector);

      expect(() => {
        runInInjectionContext(injector, () => {
          inject(WjConfirmationService).confirm({ message: 'Sure?' });
        });
      }).not.toThrow();
    });
  });
});
