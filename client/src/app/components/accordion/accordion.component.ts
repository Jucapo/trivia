import { Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-accordion',
  imports: [NgClass, NgIf],
  styleUrls: ['./accordion.component.scss'],
  template: `
    <details
      class="card host-panel host-section host-accordion"
      [ngClass]="extraClasses"
      [attr.open]="open ? '' : null"
    >
      <summary>
        <span class="accordion-title-content">
          <span *ngIf="icon" class="accordion-icon">{{ icon }}</span>
          <span class="accordion-title-text">{{ title }}</span>
        </span>
      </summary>
      <div class="accordion-content">
        <ng-content></ng-content>
      </div>
    </details>
  `,
})
export class AccordionComponent {
  @Input() title = '';
  @Input() open = false;
  @Input() icon: string = '';
  /**
   * Clases adicionales que se agregan al wrapper <details>,
   * por ejemplo: "add-question-panel category-admin-panel question-card-accordion"
   */
  @Input() extraClasses: string | string[] = '';
}

