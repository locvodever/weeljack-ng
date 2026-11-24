import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { userEvent } from 'vitest/browser';
import { _rangeKeys } from './range-keys';

/**
 * A wrapper host with the shape of the real ones: a focusable part, a second focusable element
 * that is not the part, and a bubble-phase listener on the part standing in for Optimus's own
 * `(keydown)`, which must never see a key of the map.
 */
@Component({
  selector: 'wj-range-keys-host',
  template: `
    <span #part id="part" tabindex="0" (keydown)="optimus.push($event.key)"></span>
    <button #other type="button" id="other" (keydown)="optimus.push($event.key)">Other</button>
  `,
})
class Host {
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(1);
  readonly value = signal(50);
  readonly inert = signal(false);
  /** Every `[next, event.defaultPrevented]` the keys wrote. */
  readonly written: [number, boolean][] = [];
  /** The keys Optimus's handler would have seen. */
  readonly optimus: string[] = [];
  readonly part = viewChild.required<ElementRef<HTMLElement>>('part');

  constructor() {
    _rangeKeys({
      min: this.min,
      max: this.max,
      step: this.step,
      value: this.value,
      inert: this.inert,
      part: () => this.part().nativeElement,
      write: (next, event) => {
        this.written.push([next, event.defaultPrevented]);
      },
    });
  }
}

/** The same host, without an `inert` option. */
@Component({
  selector: 'wj-range-keys-plain-host',
  template: `<span #part tabindex="0"></span>`,
})
class PlainHost {
  readonly written: number[] = [];
  readonly part = viewChild.required<ElementRef<HTMLElement>>('part');

  constructor() {
    _rangeKeys({
      min: () => 0,
      max: () => 10,
      step: () => 0,
      value: () => 4,
      part: () => this.part().nativeElement,
      write: (next) => {
        this.written.push(next);
      },
    });
  }
}

/** One part with two axes, as a colour area has: `x` on Left and Right, `y` on Down and Up. */
@Component({
  selector: 'wj-range-keys-axes-host',
  template: `<span #part tabindex="0" (keydown)="optimus.push($event.key)"></span>`,
})
class AxesHost {
  readonly written: string[] = [];
  readonly optimus: string[] = [];
  readonly part = viewChild.required<ElementRef<HTMLElement>>('part');

  constructor() {
    for (const axis of ['x', 'y'] as const) {
      _rangeKeys({
        min: () => 0,
        max: () => 100,
        step: () => 1,
        value: () => 50,
        part: () => this.part().nativeElement,
        write: (next) => {
          this.written.push(axis + String(next));
        },
        axis,
      });
    }
  }
}

async function render(
  setup: (host: Host) => void = () => undefined,
): Promise<{ fixture: ComponentFixture<Host>; host: Host; part: HTMLElement }> {
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  document.body.append(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.componentInstance,
    part: fixture.componentInstance.part().nativeElement,
  };
}

/** Sends `key` to `target` the way a browser does; `true` when nothing cancelled it. */
function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean {
  return target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );
}

/** What each key writes from `value`, in the map's order. */
function keyMap(host: Host, part: HTMLElement): Record<string, number | undefined> {
  const result: Record<string, number | undefined> = {};
  for (const key of [
    'ArrowRight',
    'ArrowUp',
    'ArrowLeft',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
  ]) {
    host.written.length = 0;
    press(part, key);
    result[key] = host.written[0]?.[0];
  }
  return result;
}

describe('_rangeKeys', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('applies the key map with step 1', async () => {
    const { host, part } = await render();

    expect(keyMap(host, part)).toEqual({
      ArrowRight: 51,
      ArrowUp: 51,
      ArrowLeft: 49,
      ArrowDown: 49,
      PageUp: 60,
      PageDown: 40,
      Home: 0,
      End: 100,
    });
  });

  it('applies the key map with step 5: an arrow moves 5, a page 50', async () => {
    const { host, part } = await render((h) => {
      h.step.set(5);
    });

    expect(keyMap(host, part)).toEqual({
      ArrowRight: 55,
      ArrowUp: 55,
      ArrowLeft: 45,
      ArrowDown: 45,
      PageUp: 100,
      PageDown: 0,
      Home: 0,
      End: 100,
    });
  });

  it('clamps to max at the top and to min at the bottom', async () => {
    const { host, part } = await render((h) => {
      h.value.set(98);
    });
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 99, PageUp: 100, PageDown: 88 });

    host.value.set(100);
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 100, ArrowUp: 100, PageUp: 100 });

    host.value.set(5);
    expect(keyMap(host, part)).toMatchObject({ ArrowLeft: 4, PageDown: 0 });

    host.value.set(0);
    expect(keyMap(host, part)).toMatchObject({ ArrowLeft: 0, ArrowDown: 0, PageDown: 0 });
  });

  it('snaps to the step grid from min, not from 0', async () => {
    const { host, part } = await render((h) => {
      h.min.set(20);
      h.max.set(80);
      h.step.set(5);
      h.value.set(20);
    });
    expect(keyMap(host, part)).toMatchObject({
      ArrowRight: 25,
      ArrowLeft: 20,
      PageUp: 70,
      PageDown: 20,
      Home: 20,
      End: 80,
    });

    // 23 is off the grid: an arrow goes to the next grid point in its direction.
    host.value.set(23);
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 25, ArrowLeft: 20, PageDown: 20 });

    // A min that is not a multiple of the step still anchors the grid: 22, 27, 32, ...
    host.min.set(22);
    host.value.set(32);
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 37, ArrowLeft: 27 });
  });

  it('ends on max itself when max is not on the grid, and steps back from it onto the grid', async () => {
    const { host, part } = await render((h) => {
      h.step.set(30);
      h.value.set(90);
    });
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 100, End: 100, ArrowLeft: 60 });

    host.value.set(100);
    expect(keyMap(host, part)).toMatchObject({ ArrowLeft: 90, ArrowRight: 100 });
  });

  it('keeps a fractional step off floating-point drift', async () => {
    const { host, part } = await render((h) => {
      h.max.set(1);
      h.step.set(0.1);
      h.value.set(0.2);
    });

    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 0.3, ArrowLeft: 0.1, PageUp: 1 });
  });

  it('reads min, max, step and value afresh on every key', async () => {
    const { host, part } = await render();
    press(part, 'ArrowRight');

    host.value.set(10);
    host.max.set(12);
    press(part, 'PageUp');
    press(part, 'End');

    expect(host.written.map(([next]) => next)).toEqual([51, 12, 12]);
  });

  it('brings a value outside the range back onto it', async () => {
    const { host, part } = await render((h) => {
      h.min.set(20);
      h.value.set(0);
    });
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 20, ArrowLeft: 20, PageUp: 20 });

    host.value.set(150);
    expect(keyMap(host, part)).toMatchObject({ ArrowRight: 100, ArrowLeft: 100, PageDown: 100 });
  });

  it('counts a step of 0 as 1, which Optimus does too', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();

    press(fixture.componentInstance.part().nativeElement, 'ArrowRight');

    expect(fixture.componentInstance.written).toEqual([5]);
  });

  it('stops the key before Optimus and cancels it, so the page does not scroll', async () => {
    const { host, part } = await render();

    for (const key of ['ArrowRight', 'PageDown', 'Home', 'End']) {
      expect(press(part, key)).toBe(false);
    }

    expect(host.optimus).toEqual([]);
    expect(host.written.every(([, prevented]) => prevented)).toBe(true);
    expect(host.written).toHaveLength(4);
  });

  it('does nothing while inert, yet still keeps the key from Optimus and the page', async () => {
    const { host, part } = await render((h) => {
      h.inert.set(true);
    });

    expect(press(part, 'ArrowRight')).toBe(false);
    expect(press(part, 'Home')).toBe(false);

    expect(host.written).toEqual([]);
    expect(host.optimus).toEqual([]);

    host.inert.set(false);
    press(part, 'ArrowRight');
    expect(host.written.map(([next]) => next)).toEqual([51]);
  });

  it('moves one step on Shift with an arrow when there is no axis', async () => {
    const { host, part } = await render();

    press(part, 'ArrowRight', { shiftKey: true });

    expect(host.written.map(([next]) => next)).toEqual([51]);
  });

  it('leaves every other key to the browser and Optimus', async () => {
    const { host, part } = await render();

    expect(press(part, 'a')).toBe(true);
    expect(press(part, 'Tab')).toBe(true);
    expect(press(part, ' ')).toBe(true);
    expect(press(part, 'Enter')).toBe(true);

    expect(host.written).toEqual([]);
    expect(host.optimus).toEqual(['a', 'Tab', ' ', 'Enter']);
  });

  it('leaves a key with Alt, Ctrl or Meta alone, so Alt+Left still goes back', async () => {
    const { host, part } = await render();

    expect(press(part, 'ArrowLeft', { altKey: true })).toBe(true);
    expect(press(part, 'ArrowRight', { ctrlKey: true })).toBe(true);
    expect(press(part, 'Home', { metaKey: true })).toBe(true);

    expect(host.written).toEqual([]);
    expect(host.optimus).toEqual(['ArrowLeft', 'ArrowRight', 'Home']);
  });

  it('handles the part’s keys only, not those of another element in the host', async () => {
    const { host, fixture } = await render();
    const other = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#other');

    expect(press(other ?? document.body, 'ArrowRight')).toBe(true);

    expect(host.written).toEqual([]);
    expect(host.optimus).toEqual(['ArrowRight']);
  });

  it('works from a real key press on the focused part', async () => {
    const { host, part } = await render();
    part.focus();

    await userEvent.keyboard('{ArrowRight}{PageDown}{End}');

    expect(host.written.map(([next]) => next)).toEqual([51, 40, 100]);
    expect(host.optimus).toEqual([]);
  });

  describe('with an axis', () => {
    async function renderAxes(): Promise<{ host: AxesHost; part: HTMLElement }> {
      const fixture = TestBed.createComponent(AxesHost);
      document.body.append(fixture.nativeElement as HTMLElement);
      await fixture.whenStable();
      return {
        host: fixture.componentInstance,
        part: fixture.componentInstance.part().nativeElement,
      };
    }

    it('gives each axis its own two arrows, and Shift ten steps', async () => {
      const { host, part } = await renderAxes();

      for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']) {
        press(part, key);
      }
      press(part, 'ArrowRight', { shiftKey: true });
      press(part, 'ArrowDown', { shiftKey: true });

      expect(host.written).toEqual(['x51', 'x49', 'y51', 'y49', 'x60', 'y40']);
    });

    it('stops its arrows before Optimus and leaves Home, End and the pages alone', async () => {
      const { host, part } = await renderAxes();

      expect(press(part, 'ArrowUp')).toBe(false);
      for (const key of ['Home', 'End', 'PageUp', 'PageDown']) {
        expect(press(part, key)).toBe(true);
      }

      expect(host.written).toEqual(['y51']);
      expect(host.optimus).toEqual(['Home', 'End', 'PageUp', 'PageDown']);
    });
  });

  it('removes its listener when the host is destroyed', async () => {
    const { fixture, host, part } = await render();
    press(part, 'Home');
    expect(host.written).toHaveLength(1);

    fixture.destroy();
    press(part, 'Home');

    expect(host.written).toHaveLength(1);
  });
});
