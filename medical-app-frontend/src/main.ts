import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors} from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import {environment} from "./environments/environment";
import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {authInterceptor} from "./app/interceptor/auth.interceptor";

const app = initializeApp(environment.firebase);
const auth = getAuth(app);
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor]))

  ],
});
