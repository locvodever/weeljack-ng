import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack } from 'weeljack-ng';

// Only the keys you set change; every other string stays English.
export const appConfig: ApplicationConfig = {
  providers: [
    provideWeeljack({
      translation: { emptyMessage: 'Nothing to show', aria: { close: 'Dismiss' } },
    }),
  ],
};
