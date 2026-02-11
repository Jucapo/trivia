import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-stack',
  imports: [NgFor],
  template: `
    <div class="toast-stack">
      <div
        *ngFor="let t of toast.toasts()"
        class="toast-item"
        [class.toast-success]="t.kind === 'success'"
        [class.toast-error]="t.kind === 'error'"
      >
        <span>{{ t.message }}</span>
        <button type="button" class="toast-close" (click)="toast.dismiss(t.id)">x</button>
      </div>
    </div>
  `,
})
export class ToastStackComponent {
  toast = inject(ToastService);
}
