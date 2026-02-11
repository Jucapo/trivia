import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastStackComponent } from './components/toast/toast-stack.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastStackComponent],
  template: `
    <div class="app-wrapper">
      <div class="container">
        <router-outlet></router-outlet>
      </div>
      <footer class="app-footer">
        <p>© 2026 Trivia · Developed by Jucapo</p>
      </footer>
    </div>
    <app-toast-stack></app-toast-stack>
  `
})
export class AppComponent {}
