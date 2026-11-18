/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  Component,
  inject,
  signal,
  viewChild,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import {
  WjFileUpload,
  WjFileUploadEmptySlot,
  type WjFileUploadEvent,
  type WjFileUploadMode,
  type WjFileUploadPt,
} from 'weeljack-ng/fileupload';
import { WjFileUploadHarness } from 'weeljack-ng/fileupload/testing';
import { vi as viLocale } from 'weeljack-ng/locale';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** A 1 x 1 PNG, so a queued image has a thumbnail that loads. */
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (character) => character.charCodeAt(0),
);

type Scheme = 'light' | 'dark';

const image = (name = 'photo.png'): File => new File([PNG], name, { type: 'image/png' });
const text = (name: string, size = 1): File =>
  new File(['x'.repeat(size)], name, { type: 'text/plain' });

/** A consumer's template: one uploader, with buttons around it for the keyboard walk. */
@Component({
  selector: 'wj-fileupload-host',
  imports: [WjFileUpload, WjFileUploadEmptySlot],
  template: `
    <button type="button" id="before">Before</button>
    <span id="caption">Photos</span>
    <div [style.inline-size]="width()">
      <wj-fileupload
        [mode]="mode()"
        [multiple]="multiple()"
        [accept]="accept()"
        [maxFileSize]="maxFileSize()"
        [fileLimit]="fileLimit()"
        [auto]="auto()"
        [disabled]="disabled()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (upload)="uploads.push($event)"
      >
        @if (hint()) {
          <ng-template wjFileUploadEmpty><p id="hint">Drag and drop images here.</p></ng-template>
        }
      </wj-fileupload>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly mode = signal<WjFileUploadMode>('advanced');
  readonly multiple = signal(false);
  readonly accept = signal<string | undefined>(undefined);
  readonly maxFileSize = signal<number | undefined>(undefined);
  readonly fileLimit = signal<number | undefined>(undefined);
  readonly auto = signal(false);
  readonly disabled = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjFileUploadPt>(undefined);
  readonly hint = signal(false);
  readonly width = signal<string | undefined>(undefined);
  readonly uploads: WjFileUploadEvent[] = [];
  readonly uploader = viewChild.required(WjFileUpload);
}

/** An uploader inside a field: the field becomes a labelled group. */
@Component({
  selector: 'wj-fileupload-field-host',
  imports: [WjField, WjFileUpload, WjFileUploadEmptySlot],
  template: `
    <wj-field label="Attachments" hint="Up to 3 files." [error]="error()">
      <wj-fileupload multiple [fileLimit]="3">
        <ng-template wjFileUploadEmpty><p>Drag and drop files here.</p></ng-template>
      </wj-fileupload>
    </wj-field>
  `,
})
class FieldHost {
  readonly error = signal<string | undefined>(undefined);
}

/** A consumer who sets aria-* on the host, where it is not forwarded. */
@Component({
  selector: 'wj-fileupload-aria-on-host-host',
  imports: [WjFileUpload],
  template: `<wj-fileupload aria-label="Photos" />`,
})
class AriaOnHostHost {}

/** A component that injects `HttpClient`, projected into the empty slot. */
@Component({ selector: 'wj-http-probe', template: 'probe' })
class HttpProbe {
  readonly client = inject(HttpClient, { optional: true });
}

@Component({
  selector: 'wj-fileupload-http-host',
  imports: [WjFileUpload, WjFileUploadEmptySlot, HttpProbe],
  template: `
    <wj-fileupload (upload)="uploads.push($event)">
      <ng-template wjFileUploadEmpty><wj-http-probe /></ng-template>
    </wj-fileupload>
  `,
})
class HttpHost {
  readonly uploads: WjFileUploadEvent[] = [];
  readonly probe = viewChild.required(HttpProbe);
}

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
  upload: WjFileUploadHarness;
}

interface RenderOptions {
  scheme?: Scheme;
  translation?: WjTranslation;
  providers?: (Provider | EnvironmentProviders)[];
  /** Lets `animate.enter` run: TestBed switches it off by default. */
  animations?: boolean;
}

/** Renders `type` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function renderAs<T>(
  type: new () => T,
  setup: (component: T) => void = () => undefined,
  options: RenderOptions = {},
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', options.scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    animationsEnabled: options.animations ?? false,
    providers: [
      provideWeeljack({ darkMode: 'class', translation: options.translation ?? {} }),
      ...(options.providers ?? []),
    ],
  });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjFileUploadHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(chooseOf(element).getBoundingClientRect().height).toBe(44);
  return { fixture, component: fixture.componentInstance, element, upload };
}

const render = (
  setup: (host: Host) => void = () => undefined,
  options: RenderOptions = {},
): Promise<Rendered<Host>> => renderAs(Host, setup, options);

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const section = (element: ParentNode, name: string): HTMLElement =>
  find(element, `[data-pc-section="${name}"]`, HTMLElement);

const uploaderOf = (element: ParentNode): HTMLElement =>
  find(element, 'wj-fileupload', HTMLElement);

const rootOf = (element: ParentNode): HTMLElement =>
  find(element, '[data-pc-name="fileupload"]', HTMLElement);

function buttonsOf(selector: string, element: ParentNode): HTMLButtonElement[] {
  return Array.from(element.querySelectorAll(selector)).filter(
    (found): found is HTMLButtonElement => found instanceof HTMLButtonElement,
  );
}

const headerButtons = (element: ParentNode): HTMLButtonElement[] =>
  buttonsOf('[data-pc-section="header"] button', element);

const removeButtons = (element: ParentNode): HTMLButtonElement[] =>
  buttonsOf('[data-pc-section="fileactions"] button', element);

function chooseOf(element: ParentNode): HTMLButtonElement {
  const [choose] = buttonsOf(
    '[data-pc-section="header"] button, [data-pc-section="basiccontent"] button',
    element,
  );
  if (choose === undefined) {
    throw new Error('the Choose button is missing');
  }
  return choose;
}

function buttonAt(buttons: HTMLButtonElement[], index: number): HTMLButtonElement {
  const button = buttons[index];
  if (button === undefined) {
    throw new Error(`no button at index ${String(index)}`);
  }
  return button;
}

/** Drops `files` on the content area, as a browser drag-and-drop would. */
function drop(target: Element, files: File[]): void {
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  target.dispatchEvent(
    new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }),
  );
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const frame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

/**
 * Runs `action`, waits three frames, and returns the `animation-duration` each message's enter
 * started with. Angular drops an enter class whose computed duration is `0s`, so under reduced
 * motion the enter never starts and the list stays empty.
 */
async function startedEnters(element: HTMLElement, action: () => Promise<void>): Promise<string[]> {
  const seen: string[] = [];
  const listener = (event: Event): void => {
    if (
      event instanceof AnimationEvent &&
      event.animationName === 'p-animate-message-enter' &&
      event.target instanceof Element
    ) {
      seen.push(getComputedStyle(event.target).animationDuration);
    }
  };
  element.addEventListener('animationstart', listener, true);
  try {
    await action();
    await frame();
    await frame();
    await frame();
  } finally {
    element.removeEventListener('animationstart', listener, true);
  }
  return seen;
}

/** The `animation-duration` a message that is entering gets, read from the cascade. */
function enterDuration(element: HTMLElement): string {
  const probe = document.createElement('p-message');
  probe.className = 'p-message p-message-enter-active';
  uploaderOf(element).append(probe);
  const { animationName, animationDuration } = getComputedStyle(probe);
  probe.remove();
  expect(animationName).toBe('p-animate-message-enter');
  return animationDuration;
}

const jsonRect = (element: Element): string => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return JSON.stringify([x, y, width, height]);
};

const STATES: [string, (host: Host) => void, (upload: WjFileUploadHarness) => Promise<void>][] = [
  [
    'advanced, empty, with the hint',
    (host) => {
      host.hint.set(true);
      host.ariaDescribedBy.set('caption');
    },
    () => Promise.resolve(),
  ],
  [
    'advanced, two files queued, one an image',
    (host) => {
      host.multiple.set(true);
    },
    (upload) => upload.chooseFiles([image(), text('notes.txt', 2048)]),
  ],
  [
    'advanced, an invalid-type message',
    (host) => {
      host.accept.set('image/*');
    },
    (upload) => upload.chooseFiles([text('notes.txt')]),
  ],
  [
    'advanced, disabled',
    (host) => {
      host.disabled.set(true);
      host.hint.set(true);
    },
    () => Promise.resolve(),
  ],
  [
    'basic, empty',
    (host) => {
      host.mode.set('basic');
    },
    () => Promise.resolve(),
  ],
  [
    'basic, one file chosen',
    (host) => {
      host.mode.set('basic');
    },
    (upload) => upload.chooseFiles([image()]),
  ],
];

describe('WjFileUpload', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await emulateReducedMotion(false);
  });

  describe('inputs', () => {
    it('mode shows the advanced box with three buttons, or the basic single button', async () => {
      const { upload, element, component, fixture } = await render();
      expect(await upload.getMode()).toBe('advanced');
      expect(headerButtons(element).map((button) => button.textContent.trim())).toEqual([
        'Choose',
        'Upload',
        'Cancel',
      ]);

      component.mode.set('basic');
      await fixture.whenStable();
      expect(await upload.getMode()).toBe('basic');
      expect(buttonsOf('button', uploaderOf(element)).map((b) => b.textContent.trim())).toEqual([
        'Choose',
      ]);
    });

    it('accept rejects a file of another type with its message, and does not queue it', async () => {
      const { upload } = await render((host) => {
        host.accept.set('image/*');
      });

      await upload.chooseFiles([text('notes.txt'), image()]);

      expect(await upload.getMessages()).toEqual([
        'notes.txt: Invalid file type, allowed file types: image/*.',
      ]);
      expect(await upload.getFileNames()).toEqual(['photo.png']);
    });

    it('maxFileSize rejects a file over the size with its message', async () => {
      const { upload } = await render((host) => {
        host.maxFileSize.set(1024);
      });

      await upload.chooseFiles([text('big.txt', 2000), text('small.txt', 100)]);

      expect(await upload.getMessages()).toEqual([
        'big.txt: Invalid file size, maximum upload size is 1.000 KB.',
      ]);
      expect(await upload.getFileNames()).toEqual(['small.txt']);
    });

    it('fileLimit warns past the limit and disables Choose once it is reached', async () => {
      const { upload } = await render((host) => {
        host.multiple.set(true);
        host.fileLimit.set(2);
      });
      expect(await upload.isDisabled()).toBe(false);

      await upload.chooseFiles([text('a.txt')]);
      expect(await upload.isDisabled()).toBe(false);
      expect(await upload.getMessages()).toEqual([]);

      await upload.chooseFiles([text('b.txt'), text('c.txt')]);
      expect(await upload.getMessages()).toEqual([
        'Maximum number of files exceeded, limit is 2 at most.',
      ]);
      expect(await upload.isDisabled()).toBe(true);
    });

    it('fileLimit counts the queue only: after Upload and clear() Choose takes the limit again', async () => {
      const { upload, component, fixture } = await render((host) => {
        host.multiple.set(true);
        host.fileLimit.set(2);
      });
      await upload.chooseFiles([text('a.txt'), text('b.txt')]);
      expect(await upload.isDisabled()).toBe(true);
      await upload.pressUpload();

      component.uploader().clear();
      await fixture.whenStable();
      expect(await upload.isDisabled()).toBe(false);
      await upload.chooseFiles([text('c.txt'), text('d.txt')]);
      expect(await upload.getFileNames()).toEqual(['c.txt', 'd.txt']);
      expect(await upload.getMessages()).toEqual([]);

      // Cancel is Optimus's own clear: it takes the count back too.
      await upload.pressUpload();
      await upload.pressCancel();
      expect(await upload.isDisabled()).toBe(false);
    });

    it('has no file limit by default: Choose stays enabled however many files are queued', async () => {
      const { upload } = await render((host) => {
        host.multiple.set(true);
      });
      expect(await upload.isDisabled()).toBe(false);

      await upload.chooseFiles([text('a.txt'), text('b.txt'), text('c.txt'), text('d.txt')]);

      expect(await upload.isDisabled()).toBe(false);
      expect(await upload.getMessages()).toEqual([]);
    });

    it('a limit set to undefined again is no limit', async () => {
      const { upload, component, fixture } = await render((host) => {
        host.fileLimit.set(1);
      });
      component.fileLimit.set(undefined);
      await fixture.whenStable();

      expect(await upload.isDisabled()).toBe(false);
    });

    it('multiple keeps several files; without it a new choice replaces the old', async () => {
      const single = await render();
      await single.upload.chooseFiles([text('a.txt')]);
      await single.upload.chooseFiles([text('b.txt')]);
      expect(await single.upload.getFileNames()).toEqual(['b.txt']);
      single.fixture.destroy();
      TestBed.resetTestingModule();

      const several = await render((host) => {
        host.multiple.set(true);
      });
      await several.upload.chooseFiles([text('a.txt')]);
      await several.upload.chooseFiles([text('b.txt')]);
      expect(await several.upload.getFileNames()).toEqual(['a.txt', 'b.txt']);
      expect(find(several.element, 'input[type="file"]', HTMLInputElement).multiple).toBe(true);
    });

    it('auto emits upload as soon as files are chosen, with no Upload or Cancel button', async () => {
      const { upload, component, element } = await render((host) => {
        host.auto.set(true);
      });
      expect(headerButtons(element)).toHaveLength(1);
      expect(component.uploads).toHaveLength(0);

      await upload.chooseFiles([text('a.txt')]);

      expect(component.uploads).toHaveLength(1);
      expect(component.uploads[0]?.files.map((file) => file.name)).toEqual(['a.txt']);
    });

    it('disabled blocks Choose, Upload and Cancel, and drops', async () => {
      const { upload, element, fixture } = await render((host) => {
        host.disabled.set(true);
      });

      expect(await upload.isDisabled()).toBe(true);
      expect(headerButtons(element).map((button) => button.disabled)).toEqual([true, true, true]);

      drop(section(element, 'content'), [text('a.txt')]);
      await fixture.whenStable();

      expect(await upload.getFileNames()).toEqual([]);
      expect(find(element, 'input[type="file"]', HTMLInputElement).disabled).toBe(true);
    });

    it('ariaLabel, ariaLabelledBy and ariaDescribedBy are set on the Choose button', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set('Choose photos');
        host.ariaLabelledBy.set('caption');
        host.ariaDescribedBy.set('hint');
      });

      const choose = chooseOf(element);
      expect(choose.getAttribute('aria-label')).toBe('Choose photos');
      expect(choose.getAttribute('aria-labelledby')).toBe('caption');
      expect(choose.getAttribute('aria-describedby')).toBe('hint');
      expect(
        uploaderOf(element)
          .getAttributeNames()
          .filter((n) => n.startsWith('aria-')),
      ).toEqual([]);
    });

    it('sets no ARIA attribute on the Choose button when none is given', async () => {
      const { element } = await render();

      const choose = chooseOf(element);
      expect(choose.hasAttribute('aria-label')).toBe(false);
      expect(choose.hasAttribute('aria-labelledby')).toBe(false);
      expect(choose.hasAttribute('aria-describedby')).toBe(false);
    });

    it('follows a changed ARIA input', async () => {
      const { element, component, fixture } = await render((host) => {
        host.ariaDescribedBy.set('hint');
      });
      component.ariaDescribedBy.set('caption');
      await fixture.whenStable();

      expect(chooseOf(element).getAttribute('aria-describedby')).toBe('caption');
    });
  });

  describe('the upload output', () => {
    it('Upload emits once with the queued files, as a fresh copy', async () => {
      const { upload, component } = await render((host) => {
        host.multiple.set(true);
      });
      await upload.chooseFiles([text('a.txt'), text('b.txt')]);

      await upload.pressUpload();

      expect(component.uploads).toHaveLength(1);
      const [event] = component.uploads;
      expect(event?.files.map((file) => file.name)).toEqual(['a.txt', 'b.txt']);
      // The event's list is a copy: emptying it leaves the component's queue alone.
      (event?.files as File[]).length = 0;
      expect(await upload.getFileNames()).toEqual(['a.txt', 'b.txt']);
      await upload.pressUpload();
      expect(component.uploads[1]?.files).toHaveLength(2);
    });

    it('upload() emits the queue, and does nothing while the queue is empty', async () => {
      const { upload, component, fixture } = await render();

      component.uploader().upload();
      await fixture.whenStable();
      expect(component.uploads).toHaveLength(0);

      await upload.chooseFiles([text('a.txt')]);
      component.uploader().upload();
      await fixture.whenStable();

      expect(component.uploads).toHaveLength(1);
      expect(component.uploads[0]?.files.map((file) => file.name)).toEqual(['a.txt']);
    });

    it('clear() empties the queue and its messages; Cancel does the same', async () => {
      const { upload, component, fixture } = await render((host) => {
        host.multiple.set(true);
        host.accept.set('text/plain');
      });
      await upload.chooseFiles([text('a.txt'), image()]);
      expect(await upload.getFileNames()).toEqual(['a.txt']);
      expect(await upload.getMessages()).toHaveLength(1);

      component.uploader().clear();
      await fixture.whenStable();
      expect(await upload.getFileNames()).toEqual([]);
      expect(await upload.getMessages()).toEqual([]);

      await upload.chooseFiles([text('b.txt')]);
      await upload.pressCancel();
      expect(await upload.getFileNames()).toEqual([]);
    });

    it('removeFile drops the one file and leaves the others', async () => {
      const { upload } = await render((host) => {
        host.multiple.set(true);
      });
      await upload.chooseFiles([text('a.txt'), text('b.txt'), text('c.txt')]);

      await upload.removeFile(1);

      expect(await upload.getFileNames()).toEqual(['a.txt', 'c.txt']);
      await expect(upload.removeFile(5)).rejects.toThrow('there is no file at index 5');
    });

    it('is not a form control: inside a field it makes the field a group', async () => {
      const { fixture, element } = await renderAs(FieldHost, () => undefined);
      const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjFieldHarness);

      expect(await field.isGroup()).toBe(true);
      const label = find(element, '.wj-field-label', HTMLElement);
      expect(label.tagName).toBe('SPAN');
      const host = find(element, 'wj-field', HTMLElement);
      expect(host.getAttribute('role')).toBe('group');
      expect(host.getAttribute('aria-labelledby')).toBe(label.id);
      expect(host.getAttribute('aria-describedby')).toContain(
        find(element, '.wj-field-hint', HTMLElement).id,
      );
      expect(chooseOf(element).textContent.trim()).toBe('Choose');
    });

    it('describes an error inside a field through the group', async () => {
      const { fixture, element } = await renderAs(FieldHost, (host) => {
        host.error.set('Add at least one file.');
      });
      await fixture.whenStable();

      const error = find(element, '.wj-field-error', HTMLElement);
      expect(error.textContent).toContain('Add at least one file.');
      expect(find(element, 'wj-field', HTMLElement).getAttribute('aria-describedby')).toContain(
        error.id,
      );
    });
  });

  describe('no request', () => {
    it('never sends one: a recording interceptor sees nothing after Upload', async () => {
      const seen: string[] = [];
      const { upload, component } = await render(
        (host) => {
          host.multiple.set(true);
        },
        {
          providers: [
            provideHttpClient(
              withInterceptors([
                (request, next) => {
                  seen.push(request.url);
                  return next(request);
                },
              ]),
            ),
          ],
        },
      );
      await upload.chooseFiles([text('a.txt')]);

      await upload.pressUpload();
      await upload.chooseFiles([text('b.txt')]);
      await upload.pressUpload();

      expect(component.uploads).toHaveLength(2);
      expect(seen).toEqual([]);
    });

    it('renders and works without provideHttpClient()', async () => {
      const { upload, component } = await render();

      await upload.chooseFiles([text('a.txt')]);
      await upload.pressUpload();

      expect(component.uploads).toHaveLength(1);
    });

    it('gives projected content the apps own HttpClient, not the uploaders', async () => {
      const { component } = await renderAs(HttpHost, () => undefined, {
        providers: [provideHttpClient()],
      });

      expect(component.probe().client).toBe(TestBed.inject(HttpClient));
    });

    it('gives projected content the client the app resolves, also without provideHttpClient()', async () => {
      // Angular 22 provides `HttpClient` in root, so an app that never calls provideHttpClient()
      // still resolves one; the uploader's view provider hands projected content the same.
      const { component } = await renderAs(HttpHost, () => undefined);

      expect(component.probe().client).toBe(TestBed.inject(HttpClient));
    });
  });

  describe('drop and the empty slot', () => {
    it('queues the files of a drop on the content area', async () => {
      const { upload, element, fixture } = await render((host) => {
        host.multiple.set(true);
      });

      drop(section(element, 'content'), [text('a.txt'), text('b.txt')]);
      await fixture.whenStable();

      expect(await upload.getFileNames()).toEqual(['a.txt', 'b.txt']);
    });

    it('shows the dashed primary border while files are dragged over, and not when disabled', async () => {
      const { element, component, fixture } = await render();
      const content = section(element, 'content');
      expect(getComputedStyle(content).borderTopStyle).toBe('solid');

      content.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
      await expect.poll(() => getComputedStyle(content).borderTopStyle).toBe('dashed');
      content.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));
      await expect.poll(() => getComputedStyle(content).borderTopStyle).toBe('solid');

      component.disabled.set(true);
      await fixture.whenStable();
      content.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
      expect(getComputedStyle(content).borderTopStyle).toBe('solid');
    });

    it('renders the empty template only while the queue is empty', async () => {
      const { upload, element, fixture } = await render((host) => {
        host.hint.set(true);
      });
      expect(element.querySelector('#hint')?.textContent).toBe('Drag and drop images here.');

      await upload.chooseFiles([text('a.txt')]);
      expect(element.querySelector('#hint')).toBeNull();

      await upload.pressCancel();
      await fixture.whenStable();
      expect(element.querySelector('#hint')?.textContent).toBe('Drag and drop images here.');
    });

    it('renders no template, and only Optimus’s empty strip, without the slot', async () => {
      const { element } = await render();

      expect(element.querySelector('#hint')).toBeNull();
      expect(section(element, 'content').children).toHaveLength(0);
    });

    it('drops the template when the slot goes away', async () => {
      const { element, component, fixture } = await render((host) => {
        host.hint.set(true);
      });
      component.hint.set(false);
      await fixture.whenStable();

      expect(element.querySelector('#hint')).toBeNull();
    });
  });

  describe('pt', () => {
    it('reaches root, the Choose button and the file name, as an object', async () => {
      const { upload, element } = await render((host) => {
        host.pt.set({
          root: { 'data-probe': 'root' },
          pcChooseButton: { root: { 'data-probe': 'choose' } },
          fileName: { 'data-probe': 'name' },
        });
      });
      await upload.chooseFiles([text('a.txt')]);

      expect(find(element, '[data-probe="root"]', HTMLElement).dataset['pcName']).toBe(
        'fileupload',
      );
      expect(find(element, '[data-probe="choose"]', HTMLElement)).toBe(chooseOf(element));
      expect(find(element, '[data-probe="name"]', HTMLElement).textContent).toBe('a.txt');
    });

    it('reaches the same parts as a function', async () => {
      const { upload, element } = await render((host) => {
        host.pt.set(() => ({
          root: { 'data-probe': 'root' },
          pcChooseButton: { root: { 'data-probe': 'choose' } },
          fileName: { 'data-probe': 'name' },
        }));
      });
      await upload.chooseFiles([text('a.txt')]);

      expect(find(element, '[data-probe="root"]', HTMLElement).dataset['pcName']).toBe(
        'fileupload',
      );
      expect(find(element, '[data-probe="choose"]', HTMLElement)).toBe(chooseOf(element));
      expect(find(element, '[data-probe="name"]', HTMLElement).textContent).toBe('a.txt');
    });

    it('lets a routed attribute win over a pt value on the same attribute', async () => {
      const { element, component, fixture } = await render((host) => {
        host.pt.set({ pcChooseButton: { root: { 'aria-label': 'from pt' } } });
        host.ariaLabel.set('mine');
      });
      expect(chooseOf(element).getAttribute('aria-label')).toBe('mine');

      // With nothing routed, the consumer's value stays.
      component.ariaLabel.set(undefined);
      await fixture.whenStable();
      expect(chooseOf(element).getAttribute('aria-label')).toBe('from pt');
    });

    it('reaches nothing for the empty part: Optimus binds it to an ng-container, which has no element', async () => {
      const { element } = await render((host) => {
        host.hint.set(true);
        host.pt.set({ empty: { 'data-probe': 'empty' } });
      });

      expect(element.querySelector('#hint')).not.toBeNull();
      expect(element.querySelector('[data-probe="empty"]')).toBeNull();
    });

    it('reaches the message part as a function too, beside the routed motion', async () => {
      const { upload, element } = await render((host) => {
        host.accept.set('image/*');
        host.pt.set({ pcMessage: () => ({ root: { 'data-probe': 'message' } }) });
      });

      await upload.chooseFiles([text('a.txt')]);

      expect(find(element, '[data-probe="message"]', HTMLElement).getAttribute('role')).toBe(
        'alert',
      );
    });

    it('lets a consumer add to a part the wrapper routes into, and keeps the routed value', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
        host.pt.set({ pcFileRemoveButton: { root: { 'data-probe': 'remove' } } });
      });
      await upload.chooseFiles([text('a.txt')]);

      const remove = find(element, '[data-probe="remove"]', HTMLElement);
      expect(remove.getAttribute('aria-label')).toBe('Remove');
    });
  });

  describe('the pt trap: every routed child part lands in the DOM', () => {
    it('reaches the Choose button, the Remove buttons, the progress bar and the messages', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
        host.accept.set('text/plain');
        host.ariaDescribedBy.set('caption');
        host.pt.set({ pcMessage: { root: { 'data-probe': 'message' } } });
      });

      await upload.chooseFiles([text('a.txt'), text('b.txt'), image()]);

      expect(chooseOf(element).getAttribute('aria-describedby')).toBe('caption');
      expect(removeButtons(element).map((b) => b.getAttribute('aria-label'))).toEqual([
        'Remove',
        'Remove',
      ]);
      const bar = find(element, 'p-progressbar', HTMLElement);
      expect(bar.hidden).toBe(true);
      expect(bar.checkVisibility()).toBe(false);
      expect(getComputedStyle(bar).display).toBe('none');
      const message = find(element, '[data-probe="message"]', HTMLElement);
      expect(message.getAttribute('role')).toBe('alert');
      expect(await upload.getMessages()).toHaveLength(1);
    });

    it('keeps every part after files are queued and removed', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
        host.ariaLabel.set('Choose photos');
      });
      await upload.chooseFiles([text('a.txt'), text('b.txt')]);

      await upload.removeFile(0);

      expect(await upload.getFileNames()).toEqual(['b.txt']);
      expect(chooseOf(element).getAttribute('aria-label')).toBe('Choose photos');
      expect(removeButtons(element).map((b) => b.getAttribute('aria-label'))).toEqual(['Remove']);
      expect(getComputedStyle(find(element, 'p-progressbar', HTMLElement)).display).toBe('none');

      await upload.removeFile(0);
      expect(removeButtons(element)).toHaveLength(0);
      await upload.chooseFiles([text('c.txt')]);
      expect(removeButtons(element).map((b) => b.getAttribute('aria-label'))).toEqual(['Remove']);
    });

    it('names a Remove button added after the first queue', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
      });
      await upload.chooseFiles([text('a.txt')]);
      await upload.chooseFiles([text('b.txt')]);

      expect(removeButtons(element).map((b) => b.getAttribute('aria-label'))).toEqual([
        'Remove',
        'Remove',
      ]);
    });
  });

  describe('translation', () => {
    it('reads Vietnamese for the messages, the buttons and the Remove name', async () => {
      const { upload, element } = await render(
        (host) => {
          host.multiple.set(true);
          host.accept.set('image/*');
          host.maxFileSize.set(1024);
          host.fileLimit.set(2);
        },
        { translation: viLocale },
      );

      await upload.chooseFiles([text('notes.txt'), image('a.png'), image('b.png'), image('c.png')]);

      const messages = await upload.getMessages();
      expect(messages).toContain(
        'notes.txt: Loại tập tin không hợp lệ, các loại tập tin được phép: image/*.',
      );
      expect(messages).toContain('Đã vượt quá số lượng tập tin tối đa, giới hạn tối đa là 2.');
      expect(headerButtons(element).map((button) => button.textContent.trim())).toEqual([
        viLocale['choose'],
        viLocale['upload'],
        viLocale['cancel'],
      ]);
      expect(removeButtons(element)[0]?.getAttribute('aria-label')).toBe(
        viLocale.aria?.['removeLabel'],
      );
    });

    it('reads the Vietnamese size message', async () => {
      const { upload } = await render(
        (host) => {
          host.maxFileSize.set(1024);
        },
        { translation: viLocale },
      );

      await upload.chooseFiles([text('big.txt', 2000)]);

      expect(await upload.getMessages()).toEqual([
        expect.stringMatching(
          /^big\.txt: Kích thước tập tin không hợp lệ, kích thước tải lên tối đa là 1\.000 \S+\.$/u,
        ),
      ]);
    });

    it('reads the Vietnamese basic label', async () => {
      const { element } = await render(
        (host) => {
          host.mode.set('basic');
        },
        { translation: viLocale },
      );

      expect(section(element, 'basiccontent').textContent).toContain(
        String(viLocale['noFileChosenMessage']),
      );
    });

    it('keeps the English default for a key a partial translation leaves out', async () => {
      const { upload } = await render(
        (host) => {
          host.accept.set('image/*');
        },
        { translation: { wj: { invalidFileTypeSummary: '{0}: Wrong type,' } } },
      );

      await upload.chooseFiles([text('notes.txt')]);

      expect(await upload.getMessages()).toEqual([
        'notes.txt: Wrong type, allowed file types: image/*.',
      ]);
    });
  });

  describe('safety: a file name is untrusted text', () => {
    const NAME = `${PAYLOAD}.png`;

    it('renders it as text in the row, the thumbnail alt and the invalid messages', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
        host.maxFileSize.set(1024);
      });
      await upload.chooseFiles([
        new File([PNG], NAME, { type: 'image/png' }),
        new File(['x'.repeat(2000)], NAME.replace('.png', '.txt'), { type: 'text/plain' }),
      ]);

      expect(await upload.getFileNames()).toEqual([NAME]);
      expect(find(element, 'img', HTMLImageElement).alt).toBe(NAME);
      expect(await upload.getMessages()).toEqual([
        `${NAME.replace('.png', '.txt')}: Invalid file size, maximum upload size is 1.000 KB.`,
      ]);
      expect(element.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders it as text in the invalid-type message', async () => {
      const { upload, element } = await render((host) => {
        host.accept.set('text/plain');
      });
      await upload.chooseFiles([new File([PNG], NAME, { type: 'image/png' })]);

      expect(await upload.getMessages()).toEqual([
        `${NAME}: Invalid file type, allowed file types: text/plain.`,
      ]);
      expect(element.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders it as text in the basic mode label', async () => {
      const { upload, element } = await render((host) => {
        host.mode.set('basic');
      });
      await upload.chooseFiles([new File([PNG], NAME, { type: 'image/png' })]);

      expect(section(element, 'basiccontent').textContent).toContain(NAME);
      expect(element.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders a payload accept string, echoed in the type message, as text', async () => {
      const { upload, element } = await render((host) => {
        host.accept.set(PAYLOAD);
      });
      await upload.chooseFiles([text('a.txt')]);

      expect(await upload.getMessages()).toEqual([
        `a.txt: Invalid file type, allowed file types: ${PAYLOAD}.`,
      ]);
      expect(find(element, 'input[type="file"]', HTMLInputElement).accept).toBe(PAYLOAD);
      expect(element.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders a payload translation value as text', async () => {
      const { upload, element } = await render(
        (host) => {
          host.accept.set('image/*');
        },
        { translation: { wj: { invalidFileTypeSummary: PAYLOAD } } },
      );
      await upload.chooseFiles([text('a.txt')]);

      expect(await upload.getMessages()).toEqual([`${PAYLOAD} allowed file types: image/*.`]);
      expect(element.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('accessibility', () => {
    it('gives each Remove button a name and a target of at least 24 by 24 px', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
      });
      await upload.chooseFiles([text('a.txt'), text('b.txt')]);

      for (const button of removeButtons(element)) {
        expect(button.getAttribute('aria-label')).toBe('Remove');
        const { width, height } = button.getBoundingClientRect();
        expect(width).toBeGreaterThanOrEqual(24);
        expect(height).toBeGreaterThanOrEqual(24);
        expect([width, height]).toEqual([44, 44]);
      }
    });

    it('hides the progress bar from view and from the accessibility tree', async () => {
      const { upload, element } = await render();
      await upload.chooseFiles([text('a.txt')]);

      const bar = find(element, 'p-progressbar', HTMLElement);
      expect(bar.getBoundingClientRect().height).toBe(0);
      expect(getComputedStyle(bar).display).toBe('none');
      expect(bar.hidden).toBe(true);
      expect(bar.checkVisibility()).toBe(false);
    });

    it('announces a message as a polite alert', async () => {
      const { upload, element } = await render((host) => {
        host.accept.set('image/*');
      });
      await upload.chooseFiles([text('a.txt')]);

      const message = find(element, '[role="alert"]', HTMLElement);
      expect(message.getAttribute('aria-live')).toBe('polite');
    });

    it('runs the 0.3 s message enter normally and not at all under reduced motion', async () => {
      const { upload, element } = await render(
        (host) => {
          host.accept.set('image/*');
        },
        { animations: true },
      );
      // The first message loads Optimus's message styles, so its own enter has none to run.
      await upload.chooseFiles([text('a.txt')]);

      const normal = await startedEnters(element, () => upload.chooseFiles([text('b.txt')]));
      expect(normal).toEqual(['0.3s']);
      expect(enterDuration(element)).toBe('0.3s');

      await emulateReducedMotion(true);
      expect(enterDuration(element)).toBe('0s');
      const reduced = await startedEnters(element, () => upload.chooseFiles([text('c.txt')]));
      expect(reduced).toEqual([]);
      // A message that is still leaving may be in the list too: the new one is there.
      expect(await upload.getMessages()).toContain(
        'c.txt: Invalid file type, allowed file types: image/*.',
      );
    });

    it('never moves focus on its own: nothing is focused after render or a choice', async () => {
      const { upload } = await render((host) => {
        host.multiple.set(true);
      });
      expect(document.activeElement).toBe(document.body);

      await upload.chooseFiles([text('a.txt')]);

      expect(document.activeElement).toBe(document.body);
    });

    it('writes no autofocus on the three header buttons', async () => {
      const { element } = await render();

      expect(headerButtons(element).map((button) => button.hasAttribute('autofocus'))).toEqual([
        false,
        false,
        false,
      ]);
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      const { element } = await renderAs(AriaOnHostHost, () => undefined);

      expect(chooseOf(element).hasAttribute('aria-label')).toBe(false);
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0003: wj-fileupload: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      await render((host) => {
        host.ariaLabel.set('Choose photos');
      });

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-fileupload: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    describe.each<Scheme>(['light', 'dark'])('axe in the %s scheme', (scheme) => {
      it.each(STATES)('finds no violation: %s', async (_name, setup, act) => {
        const { upload, element } = await render(setup, { scheme });
        await act(upload);

        await expectNoAxeViolations(uploaderOf(element));
      });

      it('finds no violation inside a field, with a hint and an error', async () => {
        const { element } = await renderAs(
          FieldHost,
          (host) => {
            host.error.set('Add at least one file.');
          },
          { scheme },
        );

        await expectNoAxeViolations(find(element, 'wj-field', HTMLElement));
      });
    });

    describe('keyboard', () => {
      let click: MockInstance<typeof HTMLInputElement.prototype.click>;

      beforeEach(() => {
        // No operating-system file dialog opens in a spec: the hidden input's click is replaced.
        click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
      });

      it('walks Choose, Upload, Cancel and each Remove, and skips the disabled ones', async () => {
        const { upload, element } = await render((host) => {
          host.multiple.set(true);
        });
        const before = find(element, '#before', HTMLButtonElement);
        const after = find(element, '#after', HTMLButtonElement);

        before.focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(chooseOf(element));
        await userEvent.tab();
        // Upload and Cancel are disabled while the queue is empty.
        expect(document.activeElement).toBe(after);

        await upload.chooseFiles([text('a.txt'), text('b.txt')]);
        const [choose, uploadButton, cancel] = headerButtons(element);
        const [first, second] = removeButtons(element);
        before.focus();
        for (const expected of [choose, uploadButton, cancel, first, second, after]) {
          await userEvent.tab();
          expect(document.activeElement).toBe(expected);
        }
        for (const expected of [second, first, cancel, uploadButton, choose, before]) {
          await userEvent.tab({ shift: true });
          expect(document.activeElement).toBe(expected);
        }
      });

      it('skips Choose, Upload and Cancel when disabled, but not a queued Remove', async () => {
        const { upload, element, component, fixture } = await render((host) => {
          host.multiple.set(true);
        });
        await upload.chooseFiles([text('a.txt')]);
        component.disabled.set(true);
        await fixture.whenStable();
        const before = find(element, '#before', HTMLButtonElement);

        before.focus();
        await userEvent.tab();

        // The listed gap: Remove stays active while the component is disabled.
        expect(document.activeElement).toBe(buttonAt(removeButtons(element), 0));
        expect(buttonAt(removeButtons(element), 0).disabled).toBe(false);
      });

      it('Space on Choose calls the hidden inputs click once', async () => {
        const { element } = await render();
        chooseOf(element).focus();

        await userEvent.keyboard(' ');

        expect(click).toHaveBeenCalledTimes(1);
        expect(click.mock.contexts[0]).toBeInstanceOf(HTMLInputElement);
      });

      it('Enter on Choose calls it twice, one dialog: the listed Optimus gap', async () => {
        const { element } = await render();
        chooseOf(element).focus();

        await userEvent.keyboard('{Enter}');

        expect(click).toHaveBeenCalledTimes(2);
      });

      it('Enter on Upload emits upload', async () => {
        const { upload, element, component } = await render();
        await upload.chooseFiles([text('a.txt')]);
        buttonAt(headerButtons(element), 1).focus();

        await userEvent.keyboard('{Enter}');

        expect(component.uploads).toHaveLength(1);
      });

      it('Enter on Cancel empties the queue', async () => {
        const { upload, element } = await render();
        await upload.chooseFiles([text('a.txt')]);
        buttonAt(headerButtons(element), 2).focus();

        await userEvent.keyboard('{Enter}');

        await expect.poll(() => upload.getFileNames()).toEqual([]);
      });

      it('Enter on a Remove button removes that file', async () => {
        const { upload, element } = await render((host) => {
          host.multiple.set(true);
        });
        await upload.chooseFiles([text('a.txt'), text('b.txt')]);
        buttonAt(removeButtons(element), 1).focus();

        await userEvent.keyboard('{Enter}');

        await expect.poll(() => upload.getFileNames()).toEqual(['a.txt']);
      });

      it('in basic mode Enter and Space on the button call the input’s click once each', async () => {
        const { element } = await render((host) => {
          host.mode.set('basic');
        });
        chooseOf(element).focus();

        await userEvent.keyboard('{Enter}');
        expect(click).toHaveBeenCalledTimes(1);
        await userEvent.keyboard(' ');
        expect(click).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('layout', () => {
    it.each<[WjFileUploadMode]>([['advanced'], ['basic']])(
      'the host is a block box equal to the Optimus root in %s mode',
      async (mode) => {
        const { element } = await render((host) => {
          host.mode.set(mode);
        });

        const host = uploaderOf(element);
        expect(getComputedStyle(host).display).toBe('block');
        expect(jsonRect(host)).toBe(jsonRect(rootOf(element)));
      },
    );

    it('draws the advanced box as Optimus does: 1 px border, 12 px radius, 18 px header, 8 px gaps', async () => {
      const { element } = await render();

      const box = getComputedStyle(rootOf(element));
      expect(box.borderTopWidth).toBe('1px');
      expect(box.borderTopLeftRadius).toBe('12px');
      const header = getComputedStyle(section(element, 'header'));
      expect(header.paddingTop).toBe('18px');
      expect(header.columnGap).toBe('8px');
      const buttons = headerButtons(element).map((button) => button.getBoundingClientRect());
      expect(buttons.map((rect) => rect.height)).toEqual([44, 44, 44]);
      expect(buttons[1]?.left).toBeCloseTo((buttons[0]?.right ?? 0) + 8, 0);
    });

    it('keeps the header on one row when wide, and wraps it to a second row when narrow', async () => {
      const wide = await render((host) => {
        host.width.set('32rem');
      });
      const tops = headerButtons(wide.element).map((button) => button.getBoundingClientRect().top);
      expect(new Set(tops).size).toBe(1);
      wide.fixture.destroy();
      TestBed.resetTestingModule();

      const narrow = await render((host) => {
        host.width.set('250px');
      });
      const box = rootOf(narrow.element);
      const [choose, , cancel] = headerButtons(narrow.element);
      expect(cancel?.getBoundingClientRect().top).toBeGreaterThan(
        (choose?.getBoundingClientRect().bottom ?? 0) - 1,
      );
      expect(getComputedStyle(section(narrow.element, 'header')).flexWrap).toBe('wrap');
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
      expect(box.getBoundingClientRect().width).toBe(250);
    });

    it('wraps a long file name anywhere and never truncates it', async () => {
      const long = `${'a'.repeat(90)}.txt`;
      const { upload, element } = await render((host) => {
        host.width.set('250px');
      });
      await upload.chooseFiles([text(long)]);

      const name = section(element, 'filename');
      expect(getComputedStyle(name).overflowWrap).toBe('anywhere');
      expect(name.textContent).toBe(long);
      expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
      expect(name.getBoundingClientRect().height).toBeGreaterThan(30);
      const box = rootOf(element);
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    });

    it('wraps the basic chosen-file text anywhere', async () => {
      const long = `${'a'.repeat(90)}.txt`;
      const { upload, element } = await render((host) => {
        host.mode.set('basic');
        host.width.set('250px');
      });
      await upload.chooseFiles([text(long)]);

      const label = find(section(element, 'basiccontent'), ':scope > span', HTMLElement);
      expect(getComputedStyle(label).overflowWrap).toBe('anywhere');
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
      const box = rootOf(element);
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    });

    it('shows a thumbnail box for an image and none for another file', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
      });
      await upload.chooseFiles([image(), text('notes.txt')]);

      const thumbnails = Array.from(element.querySelectorAll('img'));
      expect(thumbnails.map((img) => img.alt)).toEqual(['photo.png', 'notes.txt']);
      expect(getComputedStyle(thumbnails[0] ?? element).display).not.toBe('none');
      expect(thumbnails[0]?.getBoundingClientRect().width).toBe(50);
      expect(getComputedStyle(thumbnails[1] ?? element).display).toBe('none');
    });

    it('lays a queue row out with 16 px padding and a 44 px Remove at its end', async () => {
      const { upload, element } = await render((host) => {
        host.multiple.set(true);
      });
      await upload.chooseFiles([text('a.txt'), text('b.txt')]);

      const rows = Array.from(element.querySelectorAll('[data-pc-section="file"]'));
      expect(rows).toHaveLength(2);
      const row = getComputedStyle(rows[0] ?? element);
      expect(row.paddingTop).toBe('16px');
      expect(row.columnGap).toBe('16px');
      const remove = buttonAt(removeButtons(element), 0).getBoundingClientRect();
      const first = rows[0]?.getBoundingClientRect();
      expect(remove.right).toBeCloseTo((first?.right ?? 0) - 16, 0);
    });
  });
});
