import type { FileUploadPassThrough } from '@openng/optimus-ui/types/fileupload';

/** Where the chooser shows: `advanced` is a bordered box with a queue, `basic` is a single button. */
export type WjFileUploadMode = 'advanced' | 'basic';

/** What `wj-fileupload` emits when files are ready to upload. */
export interface WjFileUploadEvent {
  /** A fresh copy of the queue: changing it leaves the component's own queue alone. */
  files: readonly File[];
}

/**
 * Pass-through for `wj-fileupload`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjFileUploadPt = FileUploadPassThrough;
