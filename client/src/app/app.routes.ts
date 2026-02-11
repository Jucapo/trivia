import { Routes } from '@angular/router';
import { HostComponent } from './host.component';
import { PlayerComponent } from './player.component';

export const routes: Routes = [
  { path: 'host', component: HostComponent },
  { path: 'play', component: PlayerComponent },
  { path: '', redirectTo: 'host', pathMatch: 'full' },
  { path: '**', redirectTo: 'host' }
];
