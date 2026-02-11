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
        <button type="button" class="toast-close" (click)="toast.dismiss(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      right: 14px;
      bottom: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 9999;
      max-width: min(92vw, 360px);
    }

    .toast-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: #0f172a;
      color: #fff;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.3), 0 4px 8px rgba(15, 23, 42, 0.2);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success { 
      background: #15803d;
      box-shadow: 0 10px 30px rgba(21, 128, 61, 0.3), 0 4px 8px rgba(21, 128, 61, 0.2);
    }

    .toast-error { 
      background: #b91c1c;
      box-shadow: 0 10px 30px rgba(185, 28, 28, 0.3), 0 4px 8px rgba(185, 28, 28, 0.2);
    }

    .toast-close {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 560px) {
      .toast-stack { 
        right: 10px; 
        left: 10px; 
        max-width: none; 
      }
    }
  `]
})
export class ToastStackComponent {
  toast = inject(ToastService);
}
