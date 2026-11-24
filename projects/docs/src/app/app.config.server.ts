import { mergeApplicationConfig, type ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import apiIndex from '../generated/api/index.json';
import nav from '../generated/nav.json';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SHELL_DATA, type ShellData } from './sidebar/nav-data';

const shellData: ShellData = { version: apiIndex.version, groups: nav.groups };

export const serverConfig: ApplicationConfig = mergeApplicationConfig(appConfig, {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Static imports are fine here: this file is in the server bundle only.
    { provide: SHELL_DATA, useValue: shellData },
  ],
});
