import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-accordion',
  imports: [NgClass],
  styleUrls: ['./accordion.component.scss'],
  template: `
    <details
      class="card host-panel host-section host-accordion"
      [ngClass]="extraClasses"
      [attr.open]="open ? '' : null"
    >
      <summary>{{ title }}</summary>
      <div class="accordion-content">
        <ng-content></ng-content>
      </div>
    </details>
  `,
})
export class AccordionComponent {
  @Input() title = '';
  @Input() open = false;
  /**
   * Clases adicionales que se agregan al wrapper <details>,
   * por ejemplo: "add-question-panel category-admin-panel question-card-accordion"
   */
  @Input() extraClasses: string | string[] = '';
}

