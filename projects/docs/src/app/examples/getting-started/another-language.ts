import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack } from 'weeljack-ng';
import { vi } from 'weeljack-ng/locale';

export const appConfig: ApplicationConfig = {
  providers: [provideWeeljack({ translation: vi })],
};
