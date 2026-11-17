import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjTimeline,
  WjTimelineContentSlot,
  WjTimelineOppositeSlot,
  type WjTimelineAlign,
  type WjTimelineOrientation,
  type WjTimelinePt,
} from 'weeljack-ng/timeline';
import { WjTimelineHarness } from 'weeljack-ng/timeline/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Shipment {
  status: string;
  date: string;
}

const STATUSES = ['Order placed', 'Packed', 'Shipped', 'Delivered'];
const DATES = ['12 Nov', '13 Nov', '14 Nov', '16 Nov'];

function makeEvents(): Shipment[] {
  return STATUSES.map((status, index) => ({ status, date: DATES[index] ?? '' }));
}

/** A consumer's template: a timeline between two buttons, with every slot a consumer can give. */
@Component({
  selector: 'wj-timeline-host',
  imports: [WjTimeline, WjTimelineContentSlot, WjTimelineOppositeSlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Shipment history</p>
    <div class="frame">
      <wj-timeline
        [value]="events()"
        [align]="align()"
        [orientation]="orientation()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
      >
        @if (withContent()) {
          <ng-template wjTimelineContent [wjTimelineContentOf]="events()" let-event>
            <span class="status">{{ event.status }}</span>
            @if (withButtons()) {
              <button type="button" class="track">Track {{ event.status }}</button>
            }
          </ng-template>
        }
        @if (withOpposite()) {
          <ng-template wjTimelineOpposite [wjTimelineOppositeOf]="events()" let-event>
            <span class="date">{{ event.date }}</span>
          </ng-template>
        }
      </wj-timeline>
    </div>
    <button type="button" id="after">After</button>
  `,
  styles: `
    .frame {
      inline-size: 40rem;
    }
    .status {
      color: var(--wj-text-color);
      font-weight: 600;
    }
    .date {
      color: var(--wj-text-muted-color);
    }
  `,
})
class Host {
  readonly events = signal<Shipment[] | undefined>(makeEvents());
  readonly align = signal<WjTimelineAlign>('left');
  readonly orientation = signal<WjTimelineOrientation>('vertical');
  readonly ariaLabel = signal<string | undefined>('Shipment history');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTimelinePt | undefined>(undefined);
  readonly withContent = signal(true);
  readonly withOpposite = signal(false);
  readonly withButtons = signal(false);
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-timeline-aria-host',
  imports: [WjTimeline],
  template: `<wj-timeline [value]="[]" aria-label="Shipment history" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only. */
@Component({
  selector: 'wj-timeline-routed-host',
  imports: [WjTimeline],
  template: `<wj-timeline [value]="events" ariaLabel="Shipment history" />`,
})
class RoutedHost {
  readonly events = makeEvents();
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  timeline: WjTimelineHarness;
  element: HTMLElement;
}

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
  const timeline = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTimelineHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, '.p-timeline')).display).toBe('flex');
  return { fixture, host: fixture.componentInstance, timeline, element };
}

/** The first element matching `selector` inside `element`. */
function part(element: ParentNode, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function parts(element: ParentNode, selector: string): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>(selector));
}

const ROOT_PART = 'p-timeline';
const EVENT = '.p-timeline-event';

/** The marker and the content of the `index`th event, for placing one against the other. */
function placement(element: ParentNode, index: number): { marker: DOMRect; content: DOMRect } {
  const event = parts(element, EVENT)[index];
  if (event === undefined) {
    throw new Error(`event ${String(index)} is missing`);
  }
  return {
    marker: part(event, '.p-timeline-event-marker').getBoundingClientRect(),
    content: part(event, '.p-timeline-event-content').getBoundingClientRect(),
  };
}

/** The documented states, each rendered and checked in both schemes. */
const STATES: [string, (host: Host) => void][] = [
  ['vertical', () => undefined],
  [
    'aligned right',
    (host) => {
      host.align.set('right');
    },
  ],
  [
    'alternate',
    (host) => {
      host.align.set('alternate');
      host.withOpposite.set(true);
    },
  ],
  [
    'horizontal',
    (host) => {
      host.orientation.set('horizontal');
      host.align.set('top');
    },
  ],
  [
    'horizontal, aligned bottom',
    (host) => {
      host.orientation.set('horizontal');
      host.align.set('bottom');
    },
  ],
  [
    'with opposite content',
    (host) => {
      host.withOpposite.set(true);
    },
  ],
  [
    'named by a visible label',
    (host) => {
      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
    },
  ],
  [
    'with focusable content',
    (host) => {
      host.withButtons.set(true);
    },
  ],
  [
    'with no content slot',
    (host) => {
      host.withContent.set(false);
    },
  ],
  [
    'with no events',
    (host) => {
      host.events.set([]);
    },
  ],
];

describe('WjTimeline', () => {
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

  afterEach(() => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('value', () => {
    it('renders one event for each item, in order, with a connector between neighbours only', async () => {
      const { element, timeline } = await render();

      expect(await timeline.getEventTexts()).toEqual(STATUSES);
      expect(parts(element, EVENT)).toHaveLength(4);
      expect(parts(element, '.p-timeline-event-marker')).toHaveLength(4);
      expect(parts(element, '.p-timeline-event-connector')).toHaveLength(3);
      expect(getComputedStyle(part(element, 'wj-timeline')).display).toBe('block');
    });

    it('follows a new array', async () => {
      const { fixture, host, timeline } = await render();

      host.events.set([{ status: 'Returned', date: '20 Nov' }]);
      await fixture.whenStable();

      expect(await timeline.getEventTexts()).toEqual(['Returned']);
    });

    it('renders no event, and does not fail, for an empty or an undefined value', async () => {
      const { element, fixture, host, timeline } = await render();

      host.events.set([]);
      await fixture.whenStable();
      expect(await timeline.getEventTexts()).toEqual([]);

      host.events.set(undefined);
      await fixture.whenStable();
      expect(await timeline.getEventTexts()).toEqual([]);
      expect(element.querySelector(EVENT)).toBeNull();
      expect(part(element, ROOT_PART).getAttribute('role')).toBe('list');
    });
  });

  describe('orientation', () => {
    it('runs vertically by default: the events stack', async () => {
      const { element, timeline } = await render();
      const root = part(element, '.p-timeline');
      const [first, second] = parts(element, EVENT);

      expect(root.classList.contains('p-timeline-vertical')).toBe(true);
      expect(getComputedStyle(root).flexDirection).toBe('column');
      expect(await timeline.getOrientation()).toBe('vertical');
      expect(second?.getBoundingClientRect().top).toBeGreaterThan(
        first?.getBoundingClientRect().top ?? Infinity,
      );
      expect(second?.getBoundingClientRect().left).toBe(first?.getBoundingClientRect().left);
    });

    it('horizontal runs the events along a row, and follows a change back', async () => {
      const { element, fixture, host, timeline } = await render('light', (initial) => {
        initial.orientation.set('horizontal');
        initial.align.set('top');
      });
      const root = part(element, '.p-timeline');
      const [first, second] = parts(element, EVENT);

      expect(root.classList.contains('p-timeline-horizontal')).toBe(true);
      expect(getComputedStyle(root).flexDirection).toBe('row');
      expect(await timeline.getOrientation()).toBe('horizontal');
      expect(second?.getBoundingClientRect().left).toBeGreaterThan(
        first?.getBoundingClientRect().left ?? Infinity,
      );
      expect(second?.getBoundingClientRect().top).toBe(first?.getBoundingClientRect().top);

      host.orientation.set('vertical');
      await fixture.whenStable();
      expect(await timeline.getOrientation()).toBe('vertical');
    });
  });

  describe('align', () => {
    it('left, the default, puts the content right of the line', async () => {
      const { element } = await render();

      expect(part(element, '.p-timeline').classList.contains('p-timeline-left')).toBe(true);
      for (const index of [0, 1, 2, 3]) {
        const { marker, content } = placement(element, index);
        expect(content.left).toBeGreaterThanOrEqual(marker.right);
      }
    });

    it('right puts the content left of the line', async () => {
      const { element } = await render('light', (host) => {
        host.align.set('right');
      });

      expect(part(element, '.p-timeline').classList.contains('p-timeline-right')).toBe(true);
      for (const index of [0, 1, 2, 3]) {
        const { marker, content } = placement(element, index);
        expect(content.right).toBeLessThanOrEqual(marker.left);
      }
    });

    it('alternate switches sides from one event to the next', async () => {
      const { element } = await render('light', (host) => {
        host.align.set('alternate');
      });

      expect(part(element, '.p-timeline').classList.contains('p-timeline-alternate')).toBe(true);
      expect(placement(element, 0).content.left).toBeGreaterThanOrEqual(
        placement(element, 0).marker.right,
      );
      expect(placement(element, 1).content.right).toBeLessThanOrEqual(
        placement(element, 1).marker.left,
      );
      expect(placement(element, 2).content.left).toBeGreaterThanOrEqual(
        placement(element, 2).marker.right,
      );
    });

    it('top puts the content below the line of a horizontal timeline, and bottom above it', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.orientation.set('horizontal');
        initial.align.set('top');
      });
      expect(part(element, '.p-timeline').classList.contains('p-timeline-top')).toBe(true);
      expect(placement(element, 0).content.top).toBeGreaterThanOrEqual(
        placement(element, 0).marker.bottom,
      );

      host.align.set('bottom');
      await fixture.whenStable();

      expect(part(element, '.p-timeline').classList.contains('p-timeline-bottom')).toBe(true);
      expect(placement(element, 0).content.bottom).toBeLessThanOrEqual(
        placement(element, 0).marker.top,
      );
    });
  });

  describe('slots', () => {
    it('renders the content template for each event, with the event as its context', async () => {
      const { element, timeline } = await render();

      expect(await timeline.getEventTexts()).toEqual(STATUSES);
      expect(
        parts(element, '.p-timeline-event-content .status').map((span) => span.textContent),
      ).toEqual(STATUSES);
    });

    it('renders the opposite template for each event, across the line from the content', async () => {
      const { element, timeline } = await render('light', (host) => {
        host.withOpposite.set(true);
      });

      expect(await timeline.getOppositeTexts()).toEqual(DATES);
      expect(await timeline.getEventTexts()).toEqual(STATUSES);
      const opposite = part(element, '.p-timeline-event-opposite').getBoundingClientRect();
      expect(opposite.right).toBeLessThanOrEqual(placement(element, 0).marker.left);
    });

    it('shows nothing opposite without an opposite slot', async () => {
      const { timeline } = await render();

      expect(await timeline.getOppositeTexts()).toEqual(['', '', '', '']);
    });

    it('shows nothing for an event without a content slot, as Optimus does, and fails nowhere', async () => {
      const { element, timeline } = await render('light', (host) => {
        host.withContent.set(false);
      });

      expect(await timeline.getEventTexts()).toEqual(['', '', '', '']);
      expect(parts(element, EVENT)).toHaveLength(4);
    });
  });

  describe('FR-9: the app’s array is never changed', () => {
    it('keeps its reference, its order and its freeze through layout changes and a re-bind', async () => {
      const original = Object.freeze(makeEvents().map((event) => Object.freeze(event)));
      const { fixture, host, timeline } = await render('light', (initial) => {
        initial.events.set(original as Shipment[]);
        initial.withOpposite.set(true);
      });
      const snapshot = JSON.stringify(original);

      host.align.set('alternate');
      await fixture.whenStable();
      host.orientation.set('horizontal');
      host.align.set('top');
      await fixture.whenStable();
      host.events.set(original as Shipment[]);
      await fixture.whenStable();

      expect(host.events()).toBe(original);
      expect(Object.isFrozen(original)).toBe(true);
      expect(JSON.stringify(original)).toBe(snapshot);
      expect(await timeline.getEventTexts()).toEqual(STATUSES);
    });
  });

  describe('harness', () => {
    it('finds a timeline by its name, from ariaLabel or from the element ariaLabelledBy points at', async () => {
      const { fixture, host } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjTimelineHarness.with({ name: 'Shipment history' })),
      ).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjTimelineHarness.with({ name: /^Other/ }))).toEqual([]);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();

      const named = await loader.getHarness(WjTimelineHarness.with({ name: /Shipment/ }));
      expect(await named.getName()).toBe('Shipment history');
    });

    it('getName is empty for an unnamed timeline', async () => {
      const { timeline } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
      });

      expect(await timeline.getName()).toBe('');
    });
  });

  describe('pt', () => {
    it('forwards a pt object to every part', async () => {
      const { element } = await render('light', (host) => {
        host.withOpposite.set(true);
        host.pt.set({
          host: { 'data-host': 'yes' },
          root: { 'data-root': 'yes' },
          event: { 'data-event': 'yes' },
          eventOpposite: { 'data-opposite': 'yes' },
          eventSeparator: { 'data-separator': 'yes' },
          eventMarker: { 'data-marker': 'yes' },
          eventConnector: { 'data-connector': 'yes' },
          eventContent: { 'data-content': 'yes' },
        });
      });

      const root = part(element, ROOT_PART);
      expect(root.dataset['host']).toBe('yes');
      expect(root.dataset['root']).toBe('yes');
      for (const [selector, key] of [
        [EVENT, 'event'],
        ['.p-timeline-event-opposite', 'opposite'],
        ['.p-timeline-event-separator', 'separator'],
        ['.p-timeline-event-marker', 'marker'],
        ['.p-timeline-event-connector', 'connector'],
        ['.p-timeline-event-content', 'content'],
      ] as const) {
        expect(part(element, selector).dataset[key]).toBe('yes');
      }
      expect(part(element, EVENT).getAttribute('role')).toBe('listitem');
    });

    it('forwards the function form too, and keeps the routed roles and name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ root: { 'data-fn': 'yes' }, event: { 'data-fn-event': 'yes' } }));
      });

      const root = part(element, ROOT_PART);
      expect(root.dataset['fn']).toBe('yes');
      expect(root.getAttribute('role')).toBe('list');
      expect(root.getAttribute('aria-label')).toBe('Shipment history');
      expect(part(element, EVENT).dataset['fnEvent']).toBe('yes');
      expect(part(element, EVENT).getAttribute('role')).toBe('listitem');
    });

    it('lets a routed attribute win over a pt value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: { role: 'group', 'aria-label': 'From pt' },
          event: { role: 'presentation' },
        });
      });

      expect(part(element, ROOT_PART).getAttribute('role')).toBe('list');
      expect(part(element, ROOT_PART).getAttribute('aria-label')).toBe('Shipment history');
      expect(part(element, EVENT).getAttribute('role')).toBe('listitem');
    });
  });

  describe('ARIA', () => {
    it('makes the root a list named on the root, and every event a list item of it, not the host', async () => {
      const { element } = await render();
      const root = part(element, ROOT_PART);

      expect(root.getAttribute('role')).toBe('list');
      expect(root.getAttribute('aria-label')).toBe('Shipment history');
      const items = parts(element, EVENT);
      expect(items).toHaveLength(4);
      for (const item of items) {
        expect(item.getAttribute('role')).toBe('listitem');
        expect(item.parentElement).toBe(root);
      }
      const host = part(element, 'wj-timeline');
      expect(host.hasAttribute('aria-label')).toBe(false);
      expect(host.hasAttribute('role')).toBe(false);
    });

    it('routes ariaLabelledBy, and drops the attributes it no longer has', async () => {
      const { element, fixture, host } = await render();

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();

      const root = part(element, ROOT_PART);
      expect(root.hasAttribute('aria-label')).toBe(false);
      expect(root.getAttribute('aria-labelledby')).toBe('name');

      host.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      expect(root.hasAttribute('aria-labelledby')).toBe(false);
      expect(root.getAttribute('role')).toBe('list');
    });

    it('warns WJ0003 once, with advice that names only the inputs it has, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-timeline: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use ariaLabel or ariaLabelledBy instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-timeline: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders an event’s text, on both sides, as text', async () => {
      const { element, timeline } = await render('light', (host) => {
        host.events.set([{ status: PAYLOAD, date: PAYLOAD }]);
        host.withOpposite.set(true);
      });

      expect(await timeline.getEventTexts()).toEqual([PAYLOAD]);
      expect(await timeline.getOppositeTexts()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('sets ariaLabel and ariaLabelledBy as attribute text and creates no element', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.ariaLabel.set(PAYLOAD);
      });
      expect(part(element, ROOT_PART).getAttribute('aria-label')).toBe(PAYLOAD);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(PAYLOAD);
      await fixture.whenStable();

      expect(part(element, ROOT_PART).getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('keyboard', () => {
    it('is no tab stop of its own: Tab goes from the control before it to the one after it', async () => {
      const { element } = await render();
      part(element, '#before').focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(part(element, '#after'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(part(element, '#before'));
    });

    it('Tab moves through the focusable content inside the events, in order, and only that', async () => {
      const { element } = await render('light', (host) => {
        host.withButtons.set(true);
      });
      const tracks = parts(element, '.track');
      expect(tracks).toHaveLength(4);
      part(element, '#before').focus();

      for (const track of tracks) {
        await userEvent.tab();
        expect(document.activeElement).toBe(track);
      }
      await userEvent.tab();
      expect(document.activeElement).toBe(part(element, '#after'));

      for (const track of [...tracks].reverse()) {
        await userEvent.tab({ shift: true });
        expect(document.activeElement).toBe(track);
      }
    });
  });

  describe('axe', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(element);
      });

      it('has no axe violations while content inside an event has focus', async () => {
        const { element } = await render(scheme, (host) => {
          host.withButtons.set(true);
        });
        part(element, '.track').focus();

        await expectNoAxeViolations(element);
      });
    });
  });
});
