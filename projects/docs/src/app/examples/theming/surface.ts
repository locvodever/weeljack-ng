import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack } from 'weeljack-ng';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWeeljack({
      darkMode: 'class',
      surface: { light: '#6b7280', dark: '#78716c' },
    }),
  ],
};
