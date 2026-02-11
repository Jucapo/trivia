import { Component, signal } from '@angular/core';
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuestionBankFormComponent } from '../../components/question-bank-form/question-bank-form.component';
import { QuestionsService } from '../../questions.service';

@Component({
  standalone: true,
  selector: 'app-admin-page',
  imports: [NgFor, NgIf, TitleCasePipe, FormsModule, QuestionBankFormComponent, RouterLink],
  styleUrls: ['./admin.page.scss'],
  template: `
    <div class="container admin-container">
      <div class="card admin-card">
        <a routerLink="/" class="back-link">← Volver a inicio</a>
        <h2>Gestionar preguntas y categorias</h2>
        <p class="muted">
          Administra el banco de preguntas y las categorias disponibles para todas las partidas.
        </p>

        <app-question-bank-form
          [categories]="categories()"
          (questionAdded)="onQuestionAdded()">
        </app-question-bank-form>

        <details class="card host-panel add-question-panel category-admin-panel host-accordion">
          <summary>Gestionar categorias</summary>
          <p class="muted">Agrega nuevas categorias para usarlas al crear preguntas y filtrar partidas.</p>
          <div class="category-icon-picker">
            <span class="category-icon-picker-label">Icono (opcional):</span>
            <span class="category-icon-list">
              <button
                type="button"
                *ngFor="let ic of availableCategoryIcons"
                class="icon-pick-btn"
                [class.selected]="newCategoryIcon === ic"
                (click)="newCategoryIcon = ic"
                [title]="ic">
                {{ ic }}
              </button>
            </span>
          </div>
          <div class="category-add-row">
            <input class="input" [(ngModel)]="newCategoryName" placeholder="Nueva categoria (ej: deportes)">
            <button class="btn secondary" type="button" (click)="addCategory()" [disabled]="addingCategory()">Agregar categoria</button>
          </div>
          <div class="category-table-wrap" *ngIf="categories().length > 0">
            <table class="category-table">
              <thead>
                <tr><th>Categoria</th><th>Preguntas</th><th>% del banco</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of categories()">
                  <td>{{ c | titlecase }}</td>
                  <td>{{ categoryCounts()[c] || 0 }}</td>
                  <td>{{ categoryPct(c) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  `
})
export class AdminPage {
  categories = signal<string[]>([]);
  categoryCounts = signal<Record<string, number>>({});
  totalQuestionCount = signal(0);

  newCategoryName = '';
  newCategoryIcon = '';
  addingCategory = signal(false);
  availableCategoryIcons = ['📚','🏛️','🌍','🎬','🎮','🎵','⚽','🏀','🎾','🎨','🔬','📖','✈️','🍕','🎭','🎪','🏥','💼','🔧','📁'];

  constructor(private questions: QuestionsService) {
    this.refreshCatalog();
  }

  onQuestionAdded(): void {
    this.refreshCatalog();
  }

  refreshCatalog(): void {
    this.questions.getCatalog()
      .then((catalog) => {
        this.totalQuestionCount.set(catalog.totalCount);
        this.categories.set(catalog.categories || []);
        this.categoryCounts.set(catalog.counts || {});
      })
      .catch(() => {
        this.totalQuestionCount.set(0);
        this.categoryCounts.set({});
      });
  }

  addCategory(): void {
    const name = this.newCategoryName.trim().toLowerCase();
    if (!name) return;
    this.addingCategory.set(true);
    const icon = this.newCategoryIcon.trim() || undefined;
    this.questions.addCategory(name, icon)
      .then((result) => {
        this.newCategoryName = '';
        this.newCategoryIcon = '';
        this.refreshCatalog();
        // Feedback se maneja via toast service en el backend de QuestionsService
        console.log(result);
      })
      .finally(() => this.addingCategory.set(false));
  }

  categoryPct(cat: string): string {
    const total = this.totalQuestionCount();
    if (!total) return '0';
    const n = this.categoryCounts()[cat] || 0;
    return ((n / total) * 100).toFixed(1) + '%';
  }
}

