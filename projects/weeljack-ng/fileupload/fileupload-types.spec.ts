import type { FileUpload } from '@openng/optimus-ui/fileupload';
import type {
  FileUploadHandlerEvent,
  FileUploadPassThrough,
} from '@openng/optimus-ui/types/fileupload';
import type {
  WjFileUpload,
  WjFileUploadEvent,
  WjFileUploadMode,
  WjFileUploadPt,
} from 'weeljack-ng/fileupload';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and the output type stays something Optimus's event is assignable to. The
 * checks run in `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this
 * file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjFileUpload types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjFileUploadMode>().toExtend<NonNullable<FileUpload['mode']>>();
    expectTypeOf<WjFileUploadPt>().toEqualTypeOf<FileUploadPassThrough>();

    const mode: WjFileUploadMode = 'basic';
    expect(mode).toBe('basic');
  });

  it('narrows what comes out: the event is a read-only list of files', () => {
    expectTypeOf<FileUploadHandlerEvent>().toExtend<WjFileUploadEvent>();
    expectTypeOf<WjFileUploadEvent['files']>().toEqualTypeOf<readonly File[]>();

    const event: WjFileUploadEvent = { files: [] };
    expect(event.files).toHaveLength(0);
  });

  it('is not a form control: no value and no value accessor', () => {
    expectTypeOf<WjFileUpload>().not.toHaveProperty('value');
    expectTypeOf<WjFileUpload>().not.toHaveProperty('writeValue');
    expectTypeOf<WjFileUpload>().not.toHaveProperty('registerOnChange');

    expect(true).toBe(true);
  });
});
