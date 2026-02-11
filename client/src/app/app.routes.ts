import { Routes } from '@angular/router';
import { HostPage } from './pages/host/host.page';
import { PlayerPage } from './pages/player/player.page';
import { LandingPage } from './pages/landing/landing.page';
import { AdminPage } from './pages/admin/admin.page';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'host', component: HostPage },
  { path: 'play', component: PlayerPage },
  { path: 'admin', component: AdminPage },
  { path: '**', redirectTo: '' }
];
