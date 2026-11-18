import { NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import type { ButtonProps } from '@openng/optimus-ui/button';
import { Optimus } from '@openng/optimus-ui/config';
import { FileUpload } from '@openng/optimus-ui/fileupload';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _wjStrings,
} from 'weeljack-ng/private';
import { WjFileUploadEmptySlot } from './fileupload-slots';
import type { WjFileUploadEvent, WjFileUploadMode, WjFileUploadPt } from './fileupload-types';

/**
 * A file chooser over Optimus's `p-fileupload`: the user picks or drops files, the component
 * checks them (`accept`, `maxFileSize`, `fileLimit`) and queues the valid ones, and your app
 * uploads them. **It sends no request.** Press Upload, or choose with `auto`, and it emits
 * `upload` with a copy of the queue; send the files through your own `HttpClient` and call
 * `clear()` when that succeeds. `provideHttpClient()` is not needed for the component itself.
 *
 * It is not a form control: it has no value, and inside a `wj-field` it makes the field a group.
 * The Choose button names itself "Choose"; keep that word in any `ariaLabel`, or describe it with
 * `ariaDescribedBy`. The queue grows without a scroll: bound it with `fileLimit`.
 */
@Component({
  selector: 'wj-fileupload',
  imports: [FileUpload, NgTemplateOutlet],
  // Optimus injects `HttpClient` for a request this wrapper never lets it send. Give it the app's
  // client when there is one, `null` when there is not, and only to its own view: projected
  // content keeps the app's.
  viewProviders: [
    {
      provide: HttpClient,
      useFactory: () => inject(HttpClient, { optional: true, skipSelf: true }),
    },
  ],
  // prettier-ignore
  template: `<p-fileupload [mode]="mode()" [multiple]="multiple()" [accept]="accept()" [maxFileSize]="maxFileSize()" [fileLimit]="fileLimit()" [auto]="auto()" [disabled]="disabled()" [customUpload]="true" [chooseButtonProps]="choose" [uploadButtonProps]="secondary()" [cancelButtonProps]="secondary()" [invalidFileSizeMessageSummary]="text('invalidFileSizeSummary')" [invalidFileSizeMessageDetail]="text('invalidFileSizeDetail')" [invalidFileTypeMessageSummary]="text('invalidFileTypeSummary')" [invalidFileTypeMessageDetail]="text('invalidFileTypeDetail')" [invalidFileLimitMessageSummary]="text('invalidFileLimitSummary')" [invalidFileLimitMessageDetail]="text('invalidFileLimitDetail')" [pt]="partAttributes()" (onClear)="cleared()" (uploadHandler)="uploaded.emit({ files: $event.files.slice() })">@if (empty(); as slot) {<ng-template #empty><ng-container *ngTemplateOutlet="slot.template" /></ng-template>}</p-fileupload>`,
  styleUrl: './fileupload.css',
})
export class WjFileUpload {
  /** `advanced` is a bordered box with a queue and Upload and Cancel; `basic` is one button. */
  readonly mode = input<WjFileUploadMode>('advanced');
  /** Lets the user pick, or drop, more than one file. Without it a new choice replaces the old. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** The file types allowed: MIME types or extensions, comma separated, as the native `accept`. */
  readonly accept = input<string>();
  /** The largest file allowed, in bytes. A larger file is rejected with a message. */
  readonly maxFileSize = input<number | undefined, unknown>(undefined, {
    transform: numberAttribute,
  });
  /**
   * The most files the queue may hold. `Infinity`, the default, is no limit: Optimus reads an unset
   * limit as `NaN`, which disables Choose.
   */
  readonly fileLimit = input(Infinity, {
    transform: (limit: unknown) => numberAttribute(limit, Infinity),
  });
  /** Emits `upload` as soon as files are chosen, with no Upload and Cancel buttons. */
  readonly auto = input(false, { transform: booleanAttribute });
  /** Disables Choose, Upload, Cancel and dropping. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the Choose button. Keep its visible word "Choose" in it. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the Choose button. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the Choose button. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the uploader's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjFileUploadPt>();
  /**
   * Emits the queued files when an upload is asked for: Upload pressed, `auto` after a choice, or
   * `upload()`. Nothing is sent: that is the app's.
   */
  // The output is `upload`, as the method `upload()` is too: the property needs another name.
  // eslint-disable-next-line @angular-eslint/no-output-rename -- the public name must match the method
  readonly uploaded = output<WjFileUploadEvent>({ alias: 'upload' });

  protected readonly text = _wjStrings();
  // Optimus writes `autofocus="true"` on a button with no `autofocus` in its props, which the
  // prerendered page would then focus on load (as `wj-button` guards against). It also leaves
  // Upload and Cancel enabled while `disabled` when files were queued before: its default props
  // are `secondary`, kept here.
  protected readonly choose: ButtonProps = { autofocus: false };
  protected readonly secondary = computed<ButtonProps>(() => ({
    severity: 'secondary',
    autofocus: false,
    disabled: this.disabled(),
  }));
  protected readonly empty = contentChild(WjFileUploadEmptySlot);
  private readonly inner = viewChild(FileUpload);
  private readonly removeLabel: unknown = Reflect.get(
    Object(inject(Optimus).getTranslation('aria')),
    'removeLabel',
  );

  /**
   * `pt` forwarded as given, plus what this wrapper routes into Optimus's parts: the ARIA inputs
   * on the Choose button; a name on each Remove button, which is icon-only; the progress bar,
   * hidden from view and from assistive technology (`hidden`, which also takes it out of the
   * accessibility tree), because with no request it never moves and has no name; and safe motion
   * on the validation messages, so reduced motion stops their enter.
   */
  protected readonly partAttributes = computed<WjFileUploadPt>(() =>
    _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(
          _mergePartAttributes(this.pt(), 'pcChooseButton.root', {
            'aria-label': this.ariaLabel(),
            'aria-labelledby': this.ariaLabelledBy(),
            'aria-describedby': this.ariaDescribedBy(),
          }),
          'pcFileRemoveButton.root',
          { 'aria-label': typeof this.removeLabel === 'string' ? this.removeLabel : undefined },
        ),
        'pcProgressBar.root',
        { hidden: 'true' },
      ),
      'pcMessage.motion',
      { safe: true },
    ),
  );

  constructor() {
    _checkWeeljackSetup('wj-fileupload');
    _checkAriaOnHost('wj-fileupload');
    // Optimus reads the bridged template from a content query, and its OnPush view does not notice
    // one that appears or goes after creation: nudge it.
    effect(() => {
      this.empty();
      this.inner()?.cd.markForCheck();
    });
  }

  /**
   * Under `customUpload` Optimus adds each uploaded queue to a count that its `fileLimit` check
   * keeps, and nothing ever takes it back: after one upload and `clear()`, Choose would stay
   * short of that many files for good. This wrapper has no uploaded list, so the limit counts the
   * queue only.
   */
  protected cleared(): void {
    const inner = this.inner();
    if (inner) {
      inner.uploadedFileCount = 0;
    }
  }

  /** Asks for an upload: emits `upload` with the queue. Does nothing while the queue is empty. */
  upload(): void {
    this.inner()?.upload();
  }

  /** Empties the queue and its messages. Call it once your own upload has succeeded. */
  clear(): void {
    this.inner()?.clear();
  }
}
