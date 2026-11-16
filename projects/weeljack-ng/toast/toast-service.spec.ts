import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Injectable, inject } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideWeeljack } from 'weeljack-ng';
import { WjToast, WjToastService, type WjToastMessage } from 'weeljack-ng/toast';
import { WjToastHarness } from 'weeljack-ng/toast/testing';
import { WJ_TOAST_MESSAGES } from './toast-service';

/** The app shell: one `wj-toast`, and nothing else provided. */
@Component({ selector: 'wj-toast-shell', imports: [WjToast], template: `<wj-toast />` })
class Shell {}

/** An app's own service shaped like quanoi's `ToastService`: four named methods over `show`. */
@Injectable({ providedIn: 'root' })
class QuanoiToastService {
  private readonly toast = inject(WjToastService);

  error(code: string): void {
    this.toast.show({ severity: 'error', summary: 'Lỗi', detail: `Mã lỗi: ${code}`, life: 6000 });
  }

  errorDetail(detail: string): void {
    this.toast.show({ severity: 'error', summary: 'Lỗi', detail, life: 6000 });
  }

  info(detail: string): void {
    this.toast.show({ severity: 'info', summary: 'Thông báo', detail, life: 6000 });
  }

  success(detail: string): void {
    this.toast.show({ severity: 'success', summary: 'Thành công', detail, life: 6000 });
  }
}

const alerts = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('wj-toast [role="alert"]'));

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner reads
 * `window.matchMedia`. A CDP emulation would change the whole shared browser page, and with it every
 * spec file running beside this one.
 */
function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? reduce : value;
          },
        })
      : list;
  });
}

/** Renders the shell with only `provideWeeljack()` provided. */
async function render(): Promise<ComponentFixture<Shell>> {
  TestBed.configureTestingModule({ providers: [provideWeeljack()] });
  const fixture = TestBed.createComponent(Shell);
  await fixture.whenStable();
  return fixture;
}

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjToastHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjToastHarness);
}

describe('WjToastService', () => {
  beforeEach(() => {
    // A leave under reduced motion is immediate, so a spec never waits on the motion to end.
    reduceMotion(true);
  });

  afterEach(async () => {
    // A message left open at teardown would reach the next spec.
    TestBed.inject(WjToastService).clear();
    await expect.poll(alerts, { timeout: 5000 }).toHaveLength(0);
  });

  it('injects with only provideWeeljack() provided, and is one instance', () => {
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });
    const service = TestBed.inject(WjToastService);

    expect(service).toBeInstanceOf(WjToastService);
    expect(TestBed.inject(WjToastService)).toBe(service);
  });

  it('shows a message in a rendered wj-toast', async () => {
    const fixture = await render();
    TestBed.inject(WjToastService).show({
      severity: 'success',
      summary: 'Saved',
      detail: 'Your changes are saved.',
    });
    await expect.poll(alerts).toHaveLength(1);

    const [message] = await (await harnessOf(fixture)).getMessages();
    expect(await message?.getSeverity()).toBe('success');
    expect(await message?.getSummary()).toBe('Saved');
    expect(await message?.getDetail()).toBe('Your changes are saved.');
  });

  it('clear() closes every open message', async () => {
    await render();
    const service = TestBed.inject(WjToastService);
    service.show({ summary: 'One', life: 60000 });
    service.show({ summary: 'Two', life: 60000 });
    await expect.poll(alerts).toHaveLength(2);

    service.clear();
    await expect.poll(alerts).toHaveLength(0);
  });

  it('does not queue a message shown while no wj-toast is rendered', async () => {
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });
    TestBed.inject(WjToastService).show({ summary: 'Too early', life: 60000 });

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect(alerts()).toHaveLength(0);
  });

  describe('only the Wj fields cross to Optimus (FR-20)', () => {
    it('forwards severity, summary, detail and life, and nothing else', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const add = vi.spyOn(TestBed.inject(WJ_TOAST_MESSAGES), 'add');
      // A wider type assigned in: its extra keys must be dropped, not forwarded.
      const wider = {
        severity: 'warn',
        summary: 'Careful',
        detail: 'Look twice.',
        life: 1500,
        icon: 'pi pi-star',
        styleClass: 'wj-spec-style',
        contentStyleClass: 'wj-spec-content',
        closeIcon: 'pi pi-times',
        data: { onRetry: () => undefined },
        key: 'other',
        id: 'wj-spec-id',
        sticky: true,
        closable: false,
      } satisfies WjToastMessage & Record<string, unknown>;
      TestBed.inject(WjToastService).show(wider);

      expect(add).toHaveBeenCalledTimes(1);
      expect(add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Careful',
        detail: 'Look twice.',
        life: 1500,
      });
    });

    it('leaves an unset field out instead of passing undefined', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const add = vi.spyOn(TestBed.inject(WJ_TOAST_MESSAGES), 'add');
      TestBed.inject(WjToastService).show({ summary: 'Only a summary' });

      expect(add.mock.calls[0]?.[0]).toStrictEqual({ summary: 'Only a summary' });
    });
  });

  describe('one Optimus instance per injector', () => {
    it('a second TestBed gets a fresh service and a fresh message source', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const firstService = TestBed.inject(WjToastService);
      const firstSource = TestBed.inject(WJ_TOAST_MESSAGES);

      TestBed.resetTestingModule();
      const fixture = await render();
      expect(TestBed.inject(WjToastService)).not.toBe(firstService);
      expect(TestBed.inject(WJ_TOAST_MESSAGES)).not.toBe(firstSource);

      // The first injector's service writes to its own source, which no rendered host reads.
      firstService.show({ summary: 'From the first TestBed', life: 60000 });
      await fixture.whenStable();
      expect(alerts()).toHaveLength(0);
    });
  });

  describe('an app service over WjToastService (FR-35, the quanoi shape)', () => {
    it('runs the four methods with no other provider', async () => {
      const fixture = await render();
      const toasts = TestBed.inject(QuanoiToastService);

      toasts.error('internal');
      toasts.errorDetail('Không đọc được dữ liệu.');
      toasts.info('Đã đồng bộ.');
      toasts.success('Đã lưu.');
      await expect.poll(alerts).toHaveLength(4);

      const messages = await (await harnessOf(fixture)).getMessages();
      expect(
        await Promise.all(
          messages.map(async (message) => [
            await message.getSeverity(),
            await message.getSummary(),
            await message.getDetail(),
          ]),
        ),
      ).toEqual([
        ['error', 'Lỗi', 'Mã lỗi: internal'],
        ['error', 'Lỗi', 'Không đọc được dữ liệu.'],
        ['info', 'Thông báo', 'Đã đồng bộ.'],
        ['success', 'Thành công', 'Đã lưu.'],
      ]);
    });

    it('can be spied on the way quanoi spies on MessageService.add', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const show = vi.spyOn(TestBed.inject(WjToastService), 'show');

      TestBed.inject(QuanoiToastService).error('internal');

      expect(show).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });
});
