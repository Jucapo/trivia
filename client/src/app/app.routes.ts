import { Routes } from '@angular/router';
import { HostComponent } from './host.component';
import { PlayerComponent } from './player.component';
import { LandingComponent } from './landing.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'host', component: HostComponent },
  { path: 'play', component: PlayerComponent },
  { path: '**', redirectTo: '' }
];
