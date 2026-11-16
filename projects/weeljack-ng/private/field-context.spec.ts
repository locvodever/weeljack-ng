import { Component, Directive, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  _registerWithField,
  _WJ_FIELD_CONTEXT,
  type _WjFieldContext,
  type _WjFieldControl,
} from './field-context';

/** A field as a control meets it: the context `wj-field` provides, with its state writable. */
class TestField implements _WjFieldContext {
  readonly labelId = 'the-label';
  readonly hintId = signal<string | undefined>(undefined);
  readonly errorId = signal<string | undefined>(undefined);
  readonly invalid = signal(false);
  readonly controls = signal<readonly _WjFieldControl[]>([]);

  register(control: _WjFieldControl): () => void {
    this.controls.update((all) => [...all, control]);
    return () => {
      this.controls.update((all) => all.filter((other) => other !== control));
    };
  }
}

/** A control the way a wrapper writes it: its own state in, the resolved state out. */
@Directive({ selector: '[wjProbe]' })
class Probe {
  readonly id = input<string>();
  readonly describedBy = input<string>();
  readonly labelledBy = input<string>();
  readonly invalid = input(false);

  readonly field = _registerWithField({
    entry: 'probe',
    id: this.id,
    describedBy: this.describedBy,
    labelledBy: this.labelledBy,
    invalid: this.invalid,
  });
}

/** An inline control whose focusable element `<label for>` cannot name. */
@Directive({ selector: '[wjOffProbe]' })
class OffProbe {
  readonly labelledBy = input<string>();

  readonly field = _registerWithField({
    entry: 'off',
    id: signal(undefined),
    describedBy: signal(undefined),
    labelledBy: this.labelledBy,
    invalid: signal(false),
    labelable: false,
    inline: true,
  });
}

@Component({
  selector: 'wj-probe-host',
  imports: [Probe, OffProbe],
  template: `
    @if (shown()) {
      <input
        wjProbe
        [id]="id()"
        [describedBy]="describedBy()"
        [labelledBy]="labelledBy()"
        [invalid]="invalid()"
      />
    }
    @if (off()) {
      <span wjOffProbe [labelledBy]="labelledBy()"></span>
    }
  `,
})
class Host {
  readonly shown = signal(true);
  readonly off = signal(false);
  readonly id = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly invalid = signal(false);
}

async function render(field: TestField | null, options: { off?: boolean } = {}) {
  TestBed.configureTestingModule({
    providers: field === null ? [] : [{ provide: _WJ_FIELD_CONTEXT, useValue: field }],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.shown.set(options.off !== true);
  fixture.componentInstance.off.set(options.off === true);
  await fixture.whenStable();
  const directive = options.off === true ? OffProbe : Probe;
  const instance = fixture.debugElement.query(By.directive(directive)).injector.get(directive);
  return { fixture, host: fixture.componentInstance, probe: instance.field };
}

describe('_registerWithField', () => {
  describe('outside a field', () => {
    it('registers nothing and hands back the control�s own signals', async () => {
      const { fixture, host, probe } = await render(null);
      host.id.set('mine');
      host.describedBy.set('a b');
      host.labelledBy.set('c');
      host.invalid.set(true);
      await fixture.whenStable();

      expect(probe.inField).toBe(false);
      expect(probe.id()).toBe('mine');
      expect(probe.describedBy()).toBe('a b');
      expect(probe.labelledBy()).toBe('c');
      expect(probe.invalid()).toBe(true);
    });

    it('generates no id', async () => {
      const { probe } = await render(null);

      expect(probe.id()).toBeUndefined();
    });
  });

  describe('inside a field', () => {
    it('registers once and unregisters when the control is destroyed', async () => {
      const field = new TestField();
      const { fixture, host, probe } = await render(field);

      expect(field.controls()).toHaveLength(1);
      expect(probe.inField).toBe(true);

      host.shown.set(false);
      await fixture.whenStable();
      expect(field.controls()).toHaveLength(0);

      host.shown.set(true);
      await fixture.whenStable();
      expect(field.controls()).toHaveLength(1);
    });

    it('registers labelable and not inline by default', async () => {
      const field = new TestField();
      await render(field);

      expect(field.controls()[0]).toMatchObject({ labelable: true, inline: false });
    });

    it('registers labelable: false and inline: true when asked', async () => {
      const field = new TestField();
      await render(field, { off: true });

      expect(field.controls()[0]).toMatchObject({ labelable: false, inline: true });
    });

    it('resolves the consumer�s id, else a generated wj-<entry>-<n>', async () => {
      const field = new TestField();
      const { fixture, host, probe } = await render(field);

      expect(probe.id()).toMatch(/^wj-probe-\d+$/);
      expect(field.controls()[0]?.id()).toBe(probe.id());

      host.id.set('mine');
      await fixture.whenStable();
      expect(probe.id()).toBe('mine');
      expect(field.controls()[0]?.id()).toBe('mine');
    });

    it('merges describedby: own ids, then the hint id, then the error id', async () => {
      const field = new TestField();
      const { fixture, host, probe } = await render(field);
      host.describedBy.set('own-1 own-2');
      await fixture.whenStable();

      expect(probe.describedBy()).toBe('own-1 own-2');

      field.hintId.set('hint');
      expect(probe.describedBy()).toBe('own-1 own-2 hint');

      field.errorId.set('error');
      expect(probe.describedBy()).toBe('own-1 own-2 hint error');

      field.hintId.set(undefined);
      expect(probe.describedBy()).toBe('own-1 own-2 error');
    });

    it('removes duplicates and is undefined when there is nothing to describe', async () => {
      const field = new TestField();
      const { fixture, host, probe } = await render(field);

      expect(probe.describedBy()).toBeUndefined();

      host.describedBy.set('hint  own hint');
      field.hintId.set('hint');
      await fixture.whenStable();
      expect(probe.describedBy()).toBe('hint own');

      host.describedBy.set('   ');
      field.hintId.set(undefined);
      await fixture.whenStable();
      expect(probe.describedBy()).toBeUndefined();
    });

    it('leaves a labelable control to the field�s <label for>', async () => {
      const { fixture, host, probe } = await render(new TestField());

      expect(probe.labelledBy()).toBeUndefined();

      host.labelledBy.set('mine');
      await fixture.whenStable();
      expect(probe.labelledBy()).toBe('mine');
    });

    it('labels a non-labelable control with the field�s label id, a consumer value winning', async () => {
      const { fixture, host, probe } = await render(new TestField(), { off: true });

      expect(probe.labelledBy()).toBe('the-label');

      host.labelledBy.set('mine');
      await fixture.whenStable();
      expect(probe.labelledBy()).toBe('mine');
    });

    it('is invalid exactly while the field is, whatever the control�s own state', async () => {
      const field = new TestField();
      const { fixture, host, probe } = await render(field);

      host.invalid.set(true);
      await fixture.whenStable();
      expect(probe.invalid()).toBe(false);

      field.invalid.set(true);
      host.invalid.set(false);
      await fixture.whenStable();
      expect(probe.invalid()).toBe(true);
    });
  });
});
