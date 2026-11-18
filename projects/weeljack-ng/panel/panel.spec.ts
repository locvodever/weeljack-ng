import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import {
  WjPanel,
  WjPanelFooterSlot,
  WjPanelHeaderSlot,
  WjPanelIconsSlot,
  type WjPanelPt,
} from 'weeljack-ng/panel';
import { WjPanelHarness } from 'weeljack-ng/panel/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const WJ0110 =
  'WJ0110: wj-panel: a toggleable panel has no header text and no wjPanelHeader slot, so its ' +
  'toggle button has no accessible name. Set header or fill the wjPanelHeader slot. ' +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0110';

/** A consumer's template: native buttons around one panel, slots and content driven by signals. */
@Component({
  selector: 'wj-panel-host',
  imports: [WjPanel, WjPanelHeaderSlot, WjPanelIconsSlot, WjPanelFooterSlot, WjButton],
  template: `
    <button type="button" id="before">Before</button>
    <div [style.width]="width()">
      <wj-panel
        [header]="header()"
        [toggleable]="toggleable()"
        [collapsed]="collapsed()"
        (collapsedChange)="changed($event)"
        [pt]="pt()"
      >
        @if (headerSlot()) {
          <ng-template wjPanelHeader>
            <span class="slot-header">{{ headerSlot() }}</span>
          </ng-template>
        }
        @if (icons()) {
          <ng-template wjPanelIcons>
            <wj-button class="slot-icons" label="Edit" size="small" severity="secondary" />
          </ng-template>
        }
        @if (footer()) {
          <ng-template wjPanelFooter>
            <span class="slot-footer">{{ footer() }}</span>
          </ng-template>
        }
        <p class="body">Ships in two working days.</p>
        @if (action()) {
          <button type="button" class="action">Action</button>
        }
      </wj-panel>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly header = signal<string | undefined>('Delivery notes');
  readonly toggleable = signal(true);
  readonly collapsed = signal(false);
  readonly pt = signal<WjPanelPt>(undefined);
  readonly headerSlot = signal<string | undefined>(undefined);
  readonly icons = signal(false);
  readonly footer = signal<string | undefined>(undefined);
  readonly action = signal(false);
  readonly width = signal<string | undefined>(undefined);
  /** Every value `collapsedChange` reported, in order. */
  readonly reported = signal<boolean[]>([]);

  protected changed(next: boolean): void {
    this.collapsed.set(next);
    this.reported.update((list) => [...list, next]);
  }
}

/** A bare `toggleable` attribute, and `collapsed` bound (a model takes no bare attribute). */
@Component({
  selector: 'wj-panel-bare-host',
  imports: [WjPanel],
  template: `
    <wj-panel header="Bare" toggleable [collapsed]="true">
      <p class="body">Hidden at rest.</p>
    </wj-panel>
  `,
})
class BareHost {}

/** Two toggleable panels with no name at all: the warning is once per application. */
@Component({
  selector: 'wj-panel-unnamed-host',
  imports: [WjPanel],
  template: `
    <wj-panel toggleable>First</wj-panel>
    <wj-panel toggleable>Second</wj-panel>
  `,
})
class UnnamedHost {}

/** A panel with no toggle and no name: nothing to warn about. */
@Component({
  selector: 'wj-panel-plain-host',
  imports: [WjPanel],
  template: `<wj-panel>Just content</wj-panel>`,
})
class PlainHost {}

/** A toggleable panel named only by a header slot. */
@Component({
  selector: 'wj-panel-slot-named-host',
  imports: [WjPanel, WjPanelHeaderSlot],
  template: `
    <wj-panel toggleable>
      <ng-template wjPanelHeader>Slot title</ng-template>
      Content
    </wj-panel>
  `,
})
class SlotNamedHost {}

/** A consumer who writes `aria-*` on the host instead of using the header. */
@Component({
  selector: 'wj-panel-aria-host',
  imports: [WjPanel],
  template: `<wj-panel header="Titled" aria-label="Other">Content</wj-panel>`,
})
class AriaOnHostHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  panel: WjPanelHarness;
  element: HTMLElement;
}

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

/** Records every class list the motion element showed while it ran; call the result to stop. */
function recordMotion(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('[pmotionname]')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen].filter((name) => /enter-active|leave-active/.test(name));
  };
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const regionOf = (root: ParentNode): HTMLElement => find(root, '[role="region"]', HTMLElement);
const toggleOf = (root: ParentNode): HTMLElement =>
  find(root, '[data-pc-name="pctogglebutton"]', HTMLElement);
const titleOf = (root: ParentNode): HTMLElement =>
  find(root, '[data-pc-section="title"]', HTMLElement);
const headerOf = (root: ParentNode): HTMLElement =>
  find(root, '[data-pc-section="header"]', HTMLElement);
const actionsOf = (root: ParentNode): HTMLElement =>
  find(root, '[data-pc-section="headeractions"]', HTMLElement);

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  const title = element.querySelector('[data-pc-section="title"]');
  if (title && getComputedStyle(title).fontWeight !== '600') {
    throw new Error("Optimus's panel styles did not load");
  }
  await settled(
    element,
    fixture.componentInstance.collapsed() && fixture.componentInstance.toggleable(),
  );
  const panel = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjPanelHarness);
  return { fixture, host: fixture.componentInstance, panel, element };
}

/** Renders one of the small hosts with `provideWeeljack` (or without it). */
async function renderSmall<T>(
  type: new () => T,
  withProvider = true,
): Promise<{ fixture: ComponentFixture<T>; element: HTMLElement }> {
  if (withProvider) {
    TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  }
  const fixture = TestBed.createComponent(type);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

/**
 * Waits until the content has finished expanding or collapsing: the region's `aria-hidden` flips
 * at once, but Optimus shows or removes the content (`display`) a frame or more later, and the
 * enter or leave class stays until the motion ends. A read straight after `whenStable()` would see
 * the motion, not the end state.
 */
async function settled(root: HTMLElement, collapsed: boolean): Promise<void> {
  const region = regionOf(root);
  await expect
    .poll(() => ({
      hidden: region.getAttribute('aria-hidden'),
      shown: getComputedStyle(region).display !== 'none',
      running: /enter-active|leave-active/.test(region.className),
    }))
    .toEqual({ hidden: String(collapsed), shown: !collapsed, running: false });
}

/** The accessible name of `element` from `aria-labelledby`, as a reader would build it. */
function labelledText(element: Element): string {
  const ids = element.getAttribute('aria-labelledby')?.split(' ') ?? [];
  return ids
    .map((id) => document.getElementById(id)?.textContent.trim() ?? '')
    .join(' ')
    .trim();
}

/** Every `id` in `root`, so a duplicate can be named. */
function duplicateIds(root: ParentNode): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const element of root.querySelectorAll('[id]')) {
    if (seen.has(element.id)) {
      dupes.add(element.id);
    }
    seen.add(element.id);
  }
  return [...dupes];
}

/** The documented states for axe (FR-38). */
const STATES: [string, (host: Host) => void][] = [
  [
    'not toggleable',
    (host) => {
      host.toggleable.set(false);
    },
  ],
  ['toggleable and expanded', () => undefined],
  [
    'toggleable and collapsed',
    (host) => {
      host.collapsed.set(true);
    },
  ],
  [
    'all three slots filled',
    (host) => {
      host.headerSlot.set('3 members');
      host.icons.set(true);
      host.footer.set('Last updated 2 days ago.');
    },
  ],
  [
    'header slot with no header text',
    (host) => {
      host.header.set(undefined);
      host.headerSlot.set('Slot title');
    },
  ],
];

describe('WjPanel', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: a toggle then ends at once.
    reduceMotion(true);
  });

  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs and content', () => {
    it('shows the header as the title and the content in the box', async () => {
      const { element, panel } = await render();

      expect(await panel.getHeaderText()).toBe('Delivery notes');
      expect(titleOf(element).textContent).toBe('Delivery notes');
      expect(await panel.getContentText()).toBe('Ships in two working days.');
      expect(element.querySelectorAll('.body').length).toBe(1);
      expect(find(element, 'wj-panel', HTMLElement).children.length).toBe(1);
    });

    it('draws a toggle only while toggleable', async () => {
      const { host, element, panel } = await render('light', (instance) => {
        instance.toggleable.set(false);
      });

      expect(await panel.isToggleable()).toBe(false);
      expect(element.querySelector('[data-pc-name="pctogglebutton"]')).toBeNull();
      expect(await panel.isCollapsed()).toBe(false);

      host.toggleable.set(true);
      await expect.poll(() => panel.isToggleable()).toBe(true);
      expect(toggleOf(element).getAttribute('aria-expanded')).toBe('true');
    });

    it('accepts a bare toggleable attribute, and starts collapsed when told to', async () => {
      const { fixture, element } = await renderSmall(BareHost);
      const panel = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjPanelHarness);

      expect(await panel.isToggleable()).toBe(true);
      await settled(element, true);
      expect(await panel.isCollapsed()).toBe(true);
      expect(toggleOf(element).getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps a non-toggleable panel open whatever collapsed says', async () => {
      const { element, panel } = await render('light', (host) => {
        host.toggleable.set(false);
        host.collapsed.set(true);
      });

      expect(getComputedStyle(regionOf(element)).display).not.toBe('none');
      expect(await panel.isCollapsed()).toBe(false);
    });

    it('starts collapsed when collapsed is set, with the content out of the page flow', async () => {
      const { element, panel } = await render('light', (host) => {
        host.collapsed.set(true);
      });

      expect(await panel.isCollapsed()).toBe(true);
      expect(getComputedStyle(regionOf(element)).display).toBe('none');
      expect(await panel.getContentText()).toBe('Ships in two working days.');
    });

    it('is a block with no box of its own', async () => {
      const { element } = await render();
      const host = find(element, 'wj-panel', HTMLElement);
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(host.getBoundingClientRect().height).toBe(
        find(host, 'p-panel', HTMLElement).getBoundingClientRect().height,
      );
    });
  });

  describe('collapsed model', () => {
    it('reports every toggle and follows the parent in both directions', async () => {
      const { host, panel, element } = await render();

      await panel.toggle();
      await settled(element, true);
      expect(host.reported()).toEqual([true]);
      expect(await panel.isCollapsed()).toBe(true);

      host.collapsed.set(false);
      await settled(element, false);
      expect(await panel.isCollapsed()).toBe(false);
      expect(host.reported()).toEqual([true]);

      await panel.toggle();
      await settled(element, true);
      await panel.toggle();
      await settled(element, false);
      expect(host.reported()).toEqual([true, true, false]);
    });

    it('reports two toggles made in the same task, and ends where it began', async () => {
      const { host, element } = await render();
      const toggle = toggleOf(element);

      toggle.click();
      toggle.click();
      await settled(element, false);

      expect(host.reported()).toEqual([true, false]);
      expect(host.collapsed()).toBe(false);
    });
  });

  describe('slots', () => {
    it('renders the header slot in its own element, directly after the title', async () => {
      const { element } = await render('light', (host) => {
        host.headerSlot.set('3 members');
      });
      const wrapper = find(element, '[data-wj-part="panel-header"]', HTMLElement);

      expect(wrapper.textContent.trim()).toBe('3 members');
      expect(wrapper.previousElementSibling).toBe(titleOf(element));
      expect(wrapper.parentElement).toBe(headerOf(element));
      expect(element.querySelectorAll('.slot-header').length).toBe(1);
    });

    it('renders the icons slot in the actions area, before the toggle', async () => {
      const { element } = await render('light', (host) => {
        host.icons.set(true);
      });
      const actions = actionsOf(element);

      expect(actions.children[0]?.classList.contains('slot-icons')).toBe(true);
      expect(actions.lastElementChild?.localName).toBe('p-button');
      expect(element.querySelectorAll('.slot-icons').length).toBe(1);
    });

    it('renders the footer slot under the content, inside the collapsing region', async () => {
      const { element, panel } = await render('light', (host) => {
        host.footer.set('Last updated 2 days ago.');
      });
      const footer = find(element, '[data-pc-section="footer"]', HTMLElement);

      expect(await panel.getFooterText()).toBe('Last updated 2 days ago.');
      expect(regionOf(element).contains(footer)).toBe(true);
      expect(footer.previousElementSibling?.getAttribute('data-pc-section')).toBe('content');
    });

    it('draws no section for a slot nobody filled', async () => {
      const { element, panel } = await render();

      expect(element.querySelector('[data-wj-part="panel-header"]')).toBeNull();
      expect(element.querySelector('[data-pc-section="footer"]')).toBeNull();
      expect(await panel.getFooterText()).toBeNull();
      expect(Array.from(actionsOf(element).children).map((child) => child.localName)).toEqual([
        'p-button',
      ]);
    });

    it('leaves the actions area empty for a plain panel', async () => {
      const { element } = await renderSmall(PlainHost);

      expect(actionsOf(element).children.length).toBe(0);
    });

    it('follows a slot that appears and goes after the panel was created', async () => {
      const { host, element, panel } = await render();

      host.headerSlot.set('3 members');
      host.icons.set(true);
      host.footer.set('Footer text');
      await expect.poll(() => element.querySelectorAll('.slot-header').length).toBe(1);
      await expect.poll(() => element.querySelectorAll('.slot-icons').length).toBe(1);
      expect(await panel.getFooterText()).toBe('Footer text');

      host.headerSlot.set(undefined);
      host.icons.set(false);
      host.footer.set(undefined);
      await expect.poll(() => element.querySelectorAll('.slot-header').length).toBe(0);
      await expect.poll(() => element.querySelectorAll('.slot-icons').length).toBe(0);
      expect(await panel.getFooterText()).toBeNull();
      expect(element.querySelector('[data-wj-part="panel-header"]')).toBeNull();
    });
  });

  describe('pt', () => {
    it('reaches every part, including the nested toggle button', async () => {
      const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });
      const { element } = await render('light', (host) => {
        host.footer.set('Footer');
        host.pt.set({
          host: { 'data-probe-host': 'host' },
          root: probe('root'),
          header: probe('header'),
          title: probe('title'),
          headerActions: probe('actions'),
          pcToggleButton: { root: probe('toggle') },
          contentContainer: probe('container'),
          contentWrapper: probe('wrapper'),
          content: probe('content'),
          footer: probe('footer'),
        });
      });

      const at = (name: string): Element | null => element.querySelector(`[data-probe="${name}"]`);
      expect(at('root')?.localName).toBe('p-panel');
      expect(element.querySelector('[data-probe-host="host"]')?.localName).toBe('p-panel');
      expect(at('header')?.getAttribute('data-pc-section')).toBe('header');
      expect(at('title')?.getAttribute('data-pc-section')).toBe('title');
      expect(at('actions')?.getAttribute('data-pc-section')).toBe('headeractions');
      expect(at('toggle')?.localName).toBe('button');
      expect(at('container')?.getAttribute('role')).toBe('region');
      expect(at('wrapper')?.getAttribute('data-pc-section')).toBe('contentwrapper');
      expect(at('content')?.getAttribute('data-pc-section')).toBe('content');
      expect(at('footer')?.getAttribute('data-pc-section')).toBe('footer');
    });

    it('accepts a class string and the function form for a part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: 'probe-class', header: () => ({ 'data-probe': 'fn' }) });
      });

      expect(find(element, 'p-panel', HTMLElement).classList.contains('probe-class')).toBe(true);
      expect(find(element, '[data-probe="fn"]', HTMLElement).getAttribute('data-pc-section')).toBe(
        'header',
      );
    });

    it('changes nothing visible when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });

    it('keeps a consumer key on a part the wrapper routes attributes to', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          title: { 'data-keep': 'title' },
          pcToggleButton: { root: { 'data-keep': 'toggle' } },
          contentContainer: { 'data-keep': 'region' },
        });
      });

      expect(titleOf(element).getAttribute('data-keep')).toBe('title');
      expect(toggleOf(element).getAttribute('data-keep')).toBe('toggle');
      expect(regionOf(element).getAttribute('data-keep')).toBe('region');
      expect(duplicateIds(element)).toEqual([]);
    });

    it('lets a routed attribute win over a consumer value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          title: { id: 'mine' },
          pcToggleButton: { root: { 'aria-labelledby': 'mine', 'aria-expanded': 'maybe' } },
          contentContainer: { 'aria-labelledby': 'mine' },
        });
      });

      expect(titleOf(element).id).not.toBe('mine');
      expect(toggleOf(element).getAttribute('aria-labelledby')).toBe(titleOf(element).id);
      expect(toggleOf(element).getAttribute('aria-expanded')).toBe('true');
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(titleOf(element).id);
    });
  });

  describe('accessible names and ids (the two gaps fixed)', () => {
    it('names the toggle from the header text, and labels the region by the same title', async () => {
      const { element } = await render();
      const title = titleOf(element);

      expect(toggleOf(element).getAttribute('aria-labelledby')).toBe(title.id);
      expect(labelledText(toggleOf(element))).toBe('Delivery notes');
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(title.id);
      expect(regionOf(element).getAttribute('role')).toBe('region');
    });

    it('names the toggle from a slot-only header, and labels the region by it too', async () => {
      const { fixture, element } = await renderSmall(SlotNamedHost);
      const wrapper = find(element, '[data-wj-part="panel-header"]', HTMLElement);
      await fixture.whenStable();

      expect(wrapper.id).toMatch(/^wj-panel-header-\d+$/);
      expect(toggleOf(element).getAttribute('aria-labelledby')).toBe(wrapper.id);
      expect(labelledText(toggleOf(element))).toBe('Slot title');
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(wrapper.id);
      expect(labelledText(regionOf(element))).toBe('Slot title');
      expect(element.querySelector('[data-pc-section="title"]')).toBeNull();
    });

    it('gives every element a unique id, with the region still labelled by the header', async () => {
      const { element } = await render('light', (host) => {
        host.headerSlot.set('3 members');
        host.footer.set('Footer');
      });

      expect(duplicateIds(element)).toEqual([]);
      const labelledBy = regionOf(element).getAttribute('aria-labelledby');
      expect(labelledBy).toBe(titleOf(element).id);
      expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('Delivery notes');
      // Optimus's own id on the title and the toggle host is gone from the title.
      expect(titleOf(element).id).toMatch(/^wj-panel-title-\d+$/);
    });

    it('moves the toggle state onto the real button, which axe needs', async () => {
      const { element, panel } = await render();
      const toggle = toggleOf(element);
      const host = toggle.parentElement;

      expect(host?.localName).toBe('p-button');
      expect(host?.hasAttribute('role')).toBe(false);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.getAttribute('aria-controls')).toBe(regionOf(element).id);
      expect(toggle.getAttribute('aria-controls')).not.toBeNull();

      await panel.toggle();
      await settled(element, true);
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.getAttribute('aria-controls')).toBe(regionOf(element).id);
    });

    it('follows the name when the header text and the slot come and go', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.headerSlot.set('Slot title');
      });
      const toggle = toggleOf(element);
      expect(toggle.getAttribute('aria-labelledby')).toBe(titleOf(element).id);

      host.header.set(undefined);
      await expect
        .poll(() => toggle.getAttribute('aria-labelledby'))
        .toBe(find(element, '[data-wj-part="panel-header"]', HTMLElement).id);
      expect(regionOf(element).getAttribute('aria-labelledby')).toBe(
        toggle.getAttribute('aria-labelledby'),
      );

      host.headerSlot.set(undefined);
      await expect.poll(() => toggle.hasAttribute('aria-labelledby')).toBe(false);
      expect(regionOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(duplicateIds(element)).toEqual([]);
    });

    it('does not focus the toggle on load', async () => {
      const { element } = await render();

      expect(toggleOf(element).hasAttribute('autofocus')).toBe(false);
      expect(document.activeElement).not.toBe(toggleOf(element));
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0110 once for a toggleable panel with no name, however many there are', async () => {
      await renderSmall(UnnamedHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(WJ0110);
    });

    it('warns WJ0110 when the name goes away later, and still only once', async () => {
      const { fixture, host } = await render();
      expect(warn).not.toHaveBeenCalled();

      host.header.set(undefined);
      await expect.poll(() => warn.mock.calls.length).toBe(1);
      host.header.set('Back');
      await fixture.whenStable();
      host.header.set(undefined);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(WJ0110);
    });

    it('stays silent for a panel with header text', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays silent for a panel named by a header slot', async () => {
      await renderSmall(SlotNamedHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays silent for a panel with no toggle, named or not', async () => {
      await renderSmall(PlainHost);

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      const { element } = await renderSmall(AriaOnHostHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-panel: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the header input or a wjPanelHeader slot to name the panel. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(element.querySelector('[aria-label="Other"]:not(wj-panel)')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-panel: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('rendering safety', () => {
    it('shows an HTML payload in header as text, never as markup', async () => {
      const { element, panel } = await render('light', (host) => {
        host.header.set(PAYLOAD);
      });

      expect(await panel.getHeaderText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(labelledText(toggleOf(element))).toBe(PAYLOAD);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('gives the header row an 8 px gap and the actions a centred row with 4 px gaps', async () => {
      const { element } = await render('light', (host) => {
        host.icons.set(true);
      });
      const actions = getComputedStyle(actionsOf(element));

      expect(getComputedStyle(headerOf(element)).columnGap).toBe('8px');
      expect(actions.display).toBe('flex');
      expect(actions.alignItems).toBe('center');
      expect(actions.columnGap).toBe('4px');
    });

    it('keeps the actions at the inline end, with the header slot taking the free space', async () => {
      const { element } = await render('light', (host) => {
        host.headerSlot.set('3 members');
        host.icons.set(true);
      });
      const header = headerOf(element).getBoundingClientRect();
      const title = titleOf(element).getBoundingClientRect();
      const slot = find(element, '[data-wj-part="panel-header"]', HTMLElement);
      const actions = actionsOf(element).getBoundingClientRect();
      const edit = find(element, '.slot-icons', HTMLElement).getBoundingClientRect();
      const toggle = toggleOf(element).getBoundingClientRect();

      expect(slot.getBoundingClientRect().left).toBeGreaterThanOrEqual(title.right);
      expect(slot.getBoundingClientRect().left - title.right).toBeLessThanOrEqual(8.5);
      expect(getComputedStyle(slot).marginInlineEnd).not.toBe('0px');
      // 18 px of header padding: the actions end where the padding starts.
      expect(Math.abs(header.right - 18 - actions.right)).toBeLessThanOrEqual(1);
      expect(edit.right).toBeLessThanOrEqual(toggle.left);
      expect(toggle.right).toBeLessThanOrEqual(actions.right + 0.5);
    });

    it('lets a long title wrap, never truncating it', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('12rem');
        host.header.set('A very long panel title that keeps going and going');
      });
      const title = titleOf(element);

      expect(title.getBoundingClientRect().height).toBeGreaterThan(
        parseFloat(getComputedStyle(title).fontSize) * 1.5,
      );
      expect(getComputedStyle(title).textOverflow).toBe('clip');
      expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
    });
  });

  describe('hit boxes', () => {
    it('makes the toggle at least 24 by 24 px', async () => {
      const { element } = await render();
      const box = toggleOf(element).getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    });
  });

  describe('collapsed content', () => {
    it('leaves a focusable control out of the Tab order, with its region still labelled', async () => {
      const { element } = await render('light', (host) => {
        host.action.set(true);
        host.collapsed.set(true);
      });
      const region = regionOf(element);

      expect(region.getAttribute('aria-hidden')).toBe('true');
      expect(region.getAttribute('tabindex')).toBe('-1');
      expect(region.getAttribute('aria-labelledby')).toBe(titleOf(element).id);
      expect(getComputedStyle(region).display).toBe('none');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(find(element, 'wj-panel', HTMLElement));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the actions and then the toggle, and Shift+Tab walks back', async () => {
      const { element } = await render('light', (host) => {
        host.icons.set(true);
      });
      const edit = find(element, '.slot-icons button', HTMLElement);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(edit);
      await userEvent.tab();
      expect(document.activeElement).toBe(toggleOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(toggleOf(element));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(edit);
    });

    it('Tab skips the content of a collapsed panel and visits it once open', async () => {
      const { element, panel } = await render('light', (host) => {
        host.action.set(true);
        host.collapsed.set(true);
      });
      const action = find(element, '.action', HTMLElement);
      await panel.focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await panel.toggle();
      await settled(element, false);
      await panel.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(action);
      expect(action.hasAttribute('tabindex')).toBe(false);

      await panel.toggle();
      await settled(element, true);
      expect(action.getAttribute('tabindex')).toBe('-1');
      await panel.focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('Enter and Space each toggle the focused panel exactly once per press', async () => {
      const { element, host, panel } = await render();
      await panel.focus();

      await userEvent.keyboard('{Enter}');
      await settled(element, true);
      expect(host.reported()).toEqual([true]);
      await userEvent.keyboard('{Enter}');
      await settled(element, false);
      expect(host.reported()).toEqual([true, false]);
      await userEvent.keyboard(' ');
      await settled(element, true);
      expect(host.reported()).toEqual([true, false, true]);
      await userEvent.keyboard(' ');
      await settled(element, false);

      expect(host.reported()).toEqual([true, false, true, false]);
      expect(await panel.isFocused()).toBe(true);
    });

    it('a click toggles exactly once too', async () => {
      const { element, host, panel } = await render();

      await panel.toggle();
      await settled(element, true);

      expect(host.reported()).toEqual([true]);
    });
  });

  describe('harness', () => {
    it('reads the header, the content and the footer, and finds a panel by its header', async () => {
      const { fixture } = await render('light', (host) => {
        host.footer.set('Last updated 2 days ago.');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const panel = await loader.getHarness(WjPanelHarness.with({ headerText: 'Delivery notes' }));

      expect(await panel.getHeaderText()).toBe('Delivery notes');
      expect(await panel.getContentText()).toBe('Ships in two working days.');
      expect(await panel.getFooterText()).toBe('Last updated 2 days ago.');
      expect(await panel.isToggleable()).toBe(true);
      expect(await loader.getAllHarnesses(WjPanelHarness.with({ headerText: /^Other/ }))).toEqual(
        [],
      );
    });

    it('toggles and focuses the toggle, and says whether it has focus', async () => {
      const { element, panel } = await render();

      expect(await panel.isCollapsed()).toBe(false);
      expect(await panel.isFocused()).toBe(false);
      await panel.focus();
      expect(await panel.isFocused()).toBe(true);
      await panel.toggle();
      await settled(element, true);
      expect(await panel.isCollapsed()).toBe(true);
      expect(await panel.getContentText()).toBe('Ships in two working days.');
    });

    it('says what a panel with no toggle is, and refuses to toggle it', async () => {
      const { panel } = await render('light', (host) => {
        host.toggleable.set(false);
      });

      expect(await panel.isToggleable()).toBe(false);
      expect(await panel.isFocused()).toBe(false);
      await expect(panel.toggle()).rejects.toThrow('not toggleable');
      await expect(panel.focus()).rejects.toThrow('not toggleable');
    });

    it('names no Optimus class', () => {
      expect(WjPanelHarness.hostSelector).toBe('wj-panel');
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still reports every toggle', async () => {
      const { element, host, panel } = await render();
      const stop = recordMotion();

      await panel.toggle();
      await settled(element, true);
      await panel.toggle();
      await settled(element, false);

      expect(stop()).toEqual([]);
      expect(host.reported()).toEqual([true, false]);
    });

    it('pt.motion cannot switch safe off', async () => {
      const { element, panel } = await render('light', (host) => {
        host.pt.set({ motion: { safe: false } });
      });
      const stop = recordMotion();

      await panel.toggle();
      await settled(element, true);
      await panel.toggle();
      await settled(element, false);

      expect(stop()).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const { element, panel } = await render();
      const stop = recordMotion();

      await panel.toggle();
      await settled(element, true);
      await panel.toggle();
      await settled(element, false);

      expect(stop().length).toBeGreaterThan(0);
    });
  });
});
