import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import { vi } from 'weeljack-ng/locale';

const mine: WjTranslation = {
  emptyMessage: 'Chưa có gì để hiển thị',
  aria: { close: 'Đóng hộp thoại' },
};

// Spread `aria` on its own: `{ ...vi, ...mine }` alone would replace all of `vi.aria`.
export const appConfig: ApplicationConfig = {
  providers: [
    provideWeeljack({ translation: { ...vi, ...mine, aria: { ...vi.aria, ...mine.aria } } }),
  ],
};
