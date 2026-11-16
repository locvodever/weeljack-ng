import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack } from 'weeljack-ng';

export const appConfig: ApplicationConfig = {
  providers: [provideWeeljack({ primary: '#0f766e' })],
};
