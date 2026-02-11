import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastStackComponent } from './components/toast/toast-stack.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastStackComponent],
  template: `
    <div class="container">
      <router-outlet></router-outlet>
    </div>
    <app-toast-stack></app-toast-stack>
  `
})
export class AppComponent {}
