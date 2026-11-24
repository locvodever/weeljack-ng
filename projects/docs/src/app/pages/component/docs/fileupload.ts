import { FileUploadAdvancedExample } from '../../../examples/fileupload/advanced';
import { FileUploadBasicExample } from '../../../examples/fileupload/basic';
import { FileUploadDisabledExample } from '../../../examples/fileupload/disabled';
import { FileUploadInAFieldExample } from '../../../examples/fileupload/in-a-field';
import { FileUploadOwnUploadExample } from '../../../examples/fileupload/own-upload';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'fileupload',
  title: 'File upload',
  purpose:
    'Lets the user choose or drop files, checks them, and hands them to your app to upload. WeeljackNg sends nothing: when Upload is pressed, or files are chosen with `auto`, the component emits `upload` with the queued files, and your app sends them through its own `HttpClient` and interceptors, then calls `clear()`. `provideHttpClient()` is not required for the component itself. It is not a form control: it has no value, and inside a `wj-field` it makes the field a labelled group.',
  examples: [
    {
      title: 'Basic',
      description:
        '`mode="basic"` is one Choose button, with `auto` so the chosen file is handed to your app at once. The caption "Attachment" describes the button through `ariaDescribedBy`; the button keeps its own visible name, "Choose". The state line comes from `(upload)`.',
      sourceKey: 'fileupload/basic',
      component: FileUploadBasicExample,
    },
    {
      title: 'Advanced',
      description:
        'The default `advanced` mode is a box with Choose, Upload and Cancel, a queue and a drop area. `multiple`, `accept` and `maxFileSize` (bytes) check each file; a file that fails is not queued and shows a message at the top of the box. The `wjFileUploadEmpty` slot fills the box while the queue is empty, here as a drop-zone hint: import the slot class, or the template is silently dropped.',
      sourceKey: 'fileupload/advanced',
      component: FileUploadAdvancedExample,
    },
    {
      title: 'Your own upload',
      description:
        'The upload is yours. `(upload)` hands your app a copy of the queue, and your app sends it, here simulated with a short wait: the docs make no request. When it succeeds your app calls `clear()` on the component, which empties the queue and its messages. Show your own progress while your request runs: the component draws none.',
      sourceKey: 'fileupload/own-upload',
      component: FileUploadOwnUploadExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the uploader is not a registered control, so the field becomes a labelled group: its label is a `span`, the host gets `role="group"`, and the hint and the error describe the group. `fileLimit` caps the queue at three files. Choose keeps its own visible name.',
      sourceKey: 'fileupload/in-a-field',
      component: FileUploadInAFieldExample,
    },
    {
      title: 'Disabled',
      description:
        '`disabled` turns off Choose, Upload, Cancel and each queued file’s Remove button, and ignores a drop. Enable it again and Remove works.',
      sourceKey: 'fileupload/disabled',
      component: FileUploadDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjFileUploadHarness` from `weeljack-ng/fileupload/testing`. `chooseFiles(files)` sets the hidden file input and fires its change event, so a test never opens the operating system’s file dialog; `getFileNames()` and `getMessages()` read the queue and the validation messages; `pressUpload()`, `pressCancel()` and `removeFile(index)` press the buttons; `isDisabled()` and `getMode()` read the state. Nothing here names an Optimus class.',
      sourceKey: 'fileupload/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves through Choose, Upload and Cancel, then each queued file’s Remove button. A disabled button is skipped: Upload and Cancel while the queue is empty, and every button, Remove included, while the component is `disabled`. The hidden file input is never a stop. In `basic` mode there is the one button.',
    },
    {
      key: 'Enter, Space on Choose',
      effect: 'Opens the browser’s file dialog. In `basic` mode the button does the same.',
    },
    {
      key: 'Enter, Space on Upload',
      effect: 'Emits `upload` with the queued files. Not shown with `auto`.',
    },
    {
      key: 'Enter, Space on Cancel',
      effect: 'Empties the queue and its messages. Not shown with `auto`.',
    },
    {
      key: 'Enter, Space on a Remove button',
      effect: 'Removes that file from the queue. Focus is not moved on.',
    },
  ],
  aria: [
    'WeeljackNg sends no request. `upload` hands your app the files, and your app uploads them through its own `HttpClient`, so its interceptors, credentials and error handling are yours. The component needs no `provideHttpClient()` of its own.',
    'Choose is the one focusable part the component owns, and its name is its visible text, "Choose". `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on that button. Keep the word "Choose" inside any `ariaLabel` (WCAG 2.5.3, label in name), or leave `ariaLabel` out and give the context through `ariaDescribedBy`, as the examples do. `aria-*` written on the `wj-fileupload` host is not forwarded: it logs `WJ0003` in development.',
    'Fixed here: each queued file’s Remove button is icon-only in Optimus and has no name. It is named from the translation’s `aria.removeLabel` ("Remove" in English, "Xóa" in Vietnamese).',
    'Fixed here: Optimus shows a nameless `role="progressbar"` whenever files are queued, and with no request it never moves. The component hides it from view and from the accessibility tree.',
    'Fixed here: Optimus writes `autofocus="true"` on its header buttons, which a prerendered page would focus on load. The component turns it off on Choose, Upload and Cancel; no focus moves on its own.',
    'Fixed here: Optimus leaves Upload and Cancel enabled when the component is disabled after files were queued, and, with `fileLimit`, keeps counting an uploaded queue for good, so Choose would take fewer files after every upload. Upload and Cancel follow `disabled`, and the limit counts the queue only.',
    'Fixed here: the validation messages and the file-size units come from the translation (`en` and `vi` ship with `weeljack-ng/locale`), not from per-instance English. A message is a polite alert (`role="alert"`, `aria-live="polite"`) and stays until the next choice or `clear()`. Its enter animation does not run under `prefers-reduced-motion: reduce`.',
    'Gap, listed: every Remove button reads "Remove", not "Remove photo.png". The file name sits beside it in the same row. Optimus gives its `pt` call no per-file context to name it from.',
    'Gap, fixed: Optimus leaves each Remove button active while the component is `disabled`, so a file queued before could still be removed. Remove is now disabled with the rest and works again once the component is enabled.',
    'Gap, listed: Enter on Choose calls Optimus’s `choose()` twice, once from its `keydown.enter` binding and once from the button’s click. Only one file dialog opens.',
    'Gap, listed: Remove buttons carry Optimus’s `autofocus="true"` attribute. It is written after the button is inserted, so the browser does not act on it and no focus moves.',
    'Gap, listed: Optimus binds the `empty` part to an `ng-container`, which has no element, so an attribute set on it in `pt` lands nowhere. Put your own markup in the `wjFileUploadEmpty` template instead.',
    'A queued image has a 50 px thumbnail, a `role="presentation"` image whose `alt` is the file name; axe reports nothing on it. A file that is not an image has no thumbnail. A long file name wraps anywhere and is never cut: it is the only on-screen name of what its Remove button removes.',
    'The queue grows with no scroll of its own, so bound it with `fileLimit`. On a narrow container Choose, Upload and Cancel wrap to a second row.',
    'File names are untrusted text. They are rendered as text, in the queue, in the thumbnail’s `alt`, in the `basic` label and in the validation messages, and never as markup.',
    'Every documented state (advanced empty with the hint, two files queued with an image, an invalid-type message, disabled; basic empty and one file chosen; inside a field) has no axe violations in the light and the dark scheme.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block and the box fills it, so size the uploader through `class` or `style` on the host. `wj-fileupload` routes attributes of its own into `pcChooseButton`, `pcFileRemoveButton`, `pcProgressBar` and `pcMessage`; the rest of what you set in `pt` reaches the Optimus parts underneath, and a routed attribute wins over a value you set on the same attribute. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-fileupload`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The bordered box (`advanced`) or the row (`basic`).' },
    { part: 'input', description: 'The hidden file input.' },
    {
      part: 'header',
      description: 'The row holding Choose, Upload and Cancel (`advanced`).',
    },
    {
      part: 'pcChooseButton',
      description:
        'The Choose button. `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` go on its `root`.',
    },
    { part: 'pcUploadButton', description: 'The Upload button.' },
    { part: 'pcCancelButton', description: 'The Cancel button.' },
    {
      part: 'content',
      description: 'The area below the header: messages, the queue and the empty template.',
    },
    {
      part: 'pcProgressBar',
      description: 'The progress bar, hidden by this component: it never moves without a request.',
    },
    { part: 'pcMessage', description: 'One validation message.' },
    { part: 'fileList', description: 'The list of queued files.' },
    { part: 'file', description: 'One queued file’s row.' },
    { part: 'fileThumbnail', description: 'The image preview of a queued image.' },
    { part: 'fileInfo', description: 'The box around the file name and size.' },
    { part: 'fileName', description: 'The file name, as text.' },
    { part: 'fileSize', description: 'The file size.' },
    { part: 'pcFileBadge', description: 'The "Pending" badge.' },
    { part: 'fileActions', description: 'The box around the Remove button.' },
    {
      part: 'pcFileRemoveButton',
      description: 'The Remove button. Its `root` carries the `aria-label` from the translation.',
    },
    {
      part: 'basicContent',
      description: 'The row of the button and the chosen-file text (`basic`).',
    },
    {
      part: 'empty',
      description:
        'The empty template’s part. Optimus binds it to an `ng-container`, so no attribute lands.',
    },
  ],
  mapping: [
    {
      optimus: 'mode',
      weeljack: 'mode',
      status: 'kept',
      note: "`WjFileUploadMode` = `'advanced' | 'basic'`, default `'advanced'`.",
    },
    {
      optimus: 'multiple',
      weeljack: 'multiple',
      status: 'kept',
      note: 'Lets the user pick or drop several files.',
    },
    {
      optimus: 'accept',
      weeljack: 'accept',
      status: 'kept',
      note: 'MIME types or extensions, comma separated, as the native `accept`.',
    },
    {
      optimus: 'maxFileSize',
      weeljack: 'maxFileSize',
      status: 'kept',
      note: 'Bytes.',
    },
    {
      optimus: 'fileLimit',
      weeljack: 'fileLimit',
      status: 'kept',
      note: 'The most files in the queue. Left out, there is no limit.',
    },
    {
      optimus: 'auto',
      weeljack: 'auto',
      status: 'kept',
      note: 'Emits `upload` as soon as files are chosen.',
    },
    {
      optimus: 'disabled',
      weeljack: 'disabled',
      status: 'kept',
      note: 'Disables Choose, Upload, Cancel, each Remove and dropping.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Set on the Choose button. Keep "Choose" in any `ariaLabel`.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjFileUploadPt`. Tracks Optimus.',
    },
    {
      optimus: 'uploadHandler (output)',
      weeljack: 'upload (output)',
      status: 'renamed',
      note: '`WjFileUploadEvent` = `{ files: readonly File[] }`, a fresh copy of the queue.',
    },
    {
      optimus: 'upload()',
      weeljack: 'upload()',
      status: 'kept',
      note: 'Asks your app to upload the queue: emits `upload`. The trigger for `basic` mode without `auto`.',
    },
    {
      optimus: 'clear()',
      weeljack: 'clear()',
      status: 'kept',
      note: 'Empties the queue and its messages. Call it after your own upload succeeds.',
    },
    dropped('customUpload', 'Always `true`: WeeljackNg sends no request.'),
    dropped(
      'url, method, name, headers, withCredentials',
      'WeeljackNg sends no request. Your app uploads through its own `HttpClient`.',
    ),
    dropped(
      'onBeforeUpload, onSend, onUpload, onError, onProgress',
      'Optimus emits them only from its own request.',
    ),
    dropped(
      'onRemoveUploadedFile, files',
      'The uploaded list is never filled without Optimus’s own request, and the queue is the component’s.',
    ),
    dropped(
      'onSelect, onRemove, onClear',
      'Exposed by need: `upload` hands over the queue. Each can return as a camelCase output, never as `select`, which is a DOM event name.',
    ),
    dropped('onImageError', 'Exposed by need.'),
    dropped(
      'chooseLabel, uploadLabel, cancelLabel',
      'Optimus reads `choose`, `upload` and `cancel` from the translation.',
    ),
    dropped(
      'invalidFileSizeMessageSummary/Detail, invalidFileTypeMessageSummary/Detail, invalidFileLimitMessageSummary/Detail',
      'Per-instance English in Optimus. The component supplies them from six own strings of the `wj` translation group: `invalidFileSizeSummary` and `Detail`, `invalidFileTypeSummary` and `Detail`, `invalidFileLimitSummary` and `Detail`.',
    ),
    dropped(
      'chooseIcon, uploadIcon, cancelIcon; templates chooseicon, uploadicon, cancelicon',
      'Icon slots are never exposed.',
    ),
    {
      optimus: 'template empty',
      weeljack: '`wjFileUploadEmpty` slot',
      status: 'renamed',
      note: 'An `ng-template[wjFileUploadEmpty]`, typed `WjFileUploadEmptySlot`. Shown in `advanced` mode while the queue is empty.',
    },
    dropped(
      'templates header, content, toolbar, file, filelabel',
      'Exposed by need; each can return as a typed slot.',
    ),
    dropped(
      'previewWidth, showUploadButton, showCancelButton',
      'Exposed by need. Optimus’s defaults hold: 50 px previews, and both buttons unless `auto`.',
    ),
    dropped(
      'chooseButtonProps, uploadButtonProps, cancelButtonProps',
      'Optimus’s button props would cross the interface. `pt` reaches the buttons.',
    ),
    dropped(
      'uploadStyleClass, cancelStyleClass, removeStyleClass, chooseStyleClass, style, styleClass; dt, unstyled, ptOptions, FileUploadModule',
      droppedAlways,
    ),
    dropped(
      'remove(), removeUploadedFile(), choose(), uploader()',
      'Exposed by need: the Remove buttons and Choose cover them.',
    ),
    dropped('p-fileUpload', 'Duplicate selector.'),
  ],
};
