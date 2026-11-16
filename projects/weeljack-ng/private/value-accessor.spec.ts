import { Component, booleanAttribute, input, model, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Checkbox } from '@openng/optimus-ui/checkbox';
import { _bridgeAccessor, type _AccessorHost } from './value-accessor';

/** A control the way a wrapper writes it: a model, an input, and a real Optimus control inside. */
@Component({
  selector: 'wj-bridge-probe',
  imports: [Checkbox],
  template: `<p-checkbox binary aria-label="Probe" [disabled]="isDisabled()" />`,
})
class Probe {
  readonly value = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  private readonly inner = viewChild(Checkbox);
  readonly isDisabled = _bridgeAccessor(
    this,
    'wj-bridge-probe',
    this.value,
    this.inner,
    this.disabled,
  );

  declare registerOnChange: _AccessorHost<boolean>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<boolean>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<boolean>['setDisabledState'];
}

interface Rendered {
  fixture: ComponentFixture<Probe>;
  probe: Probe;
  box: () => HTMLInputElement;
}

/** The form side of the bridge: what a `FormControl` or `ngModel` would register. */
function formSide(probe: Probe): { changes: boolean[]; touches: number[] } {
  const changes: boolean[] = [];
  const touches: number[] = [];
  probe.registerOnChange((value) => {
    changes.push(value);
  });
  probe.registerOnTouched(() => {
    touches.push(touches.length);
  });
  return { changes, touches };
}

async function render(before: (probe: Probe) => void = () => undefined): Promise<Rendered> {
  const fixture = TestBed.createComponent(Probe);
  before(fixture.componentInstance);
  await fixture.whenStable();
  const box = (): HTMLInputElement => {
    const found = (fixture.nativeElement as HTMLElement).querySelector('input');
    if (!(found instanceof HTMLInputElement)) {
      throw new Error('the inner checkbox input is missing');
    }
    return found;
  };
  return { fixture, probe: fixture.componentInstance, box };
}

describe('_bridgeAccessor', () => {
  it('holds a value written before the inner control exists, then pushes it in', async () => {
    const { box } = await render((probe) => {
      probe.value.set(true);
    });

    expect(box().checked).toBe(true);
  });

  it('writes every model change into the inner control', async () => {
    const { fixture, probe, box } = await render();
    expect(box().checked).toBe(false);

    probe.value.set(true);
    await fixture.whenStable();
    expect(box().checked).toBe(true);

    probe.value.set(false);
    await fixture.whenStable();
    expect(box().checked).toBe(false);
  });

  it('turns a click into a model update and a form change callback', async () => {
    const { fixture, probe, box } = await render();
    const form = formSide(probe);

    box().click();
    await fixture.whenStable();

    expect(probe.value()).toBe(true);
    expect(form.changes).toEqual([true]);
  });

  it('calls the form touched callback when the inner control blurs', async () => {
    const { probe, box } = await render();
    const form = formSide(probe);

    box().focus();
    expect(form.touches).toHaveLength(0);
    box().blur();

    expect(form.touches).toHaveLength(1);
  });

  it('never calls the form change callback for a value written into the model', async () => {
    const { fixture, probe, box } = await render();
    const form = formSide(probe);

    probe.value.set(true);
    await fixture.whenStable();

    expect(box().checked).toBe(true);
    expect(form.changes).toEqual([]);
  });

  it('is disabled by the input, by the form, or by both', async () => {
    const { fixture, probe, box } = await render();
    expect(probe.isDisabled()).toBe(false);
    expect(box().disabled).toBe(false);

    probe.setDisabledState(true);
    await fixture.whenStable();
    expect(probe.isDisabled()).toBe(true);
    expect(box().disabled).toBe(true);

    fixture.componentRef.setInput('disabled', true);
    probe.setDisabledState(false);
    await fixture.whenStable();
    expect(probe.isDisabled()).toBe(true);
    expect(box().disabled).toBe(true);

    fixture.componentRef.setInput('disabled', false);
    await fixture.whenStable();
    expect(box().disabled).toBe(false);
  });
});
