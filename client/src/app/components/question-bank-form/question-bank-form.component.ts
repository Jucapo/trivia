import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { QuestionsService, type QuestionItem } from '../../questions.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  selector: 'app-question-bank-form',
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <details class="card host-panel add-question-panel host-accordion">
      <summary>Anadir pregunta al banco</summary>
      <p class="muted">Las preguntas nuevas quedaran disponibles para partidas futuras.</p>
      <form class="add-question-form" (ngSubmit)="submitQuestion()">
        <label>Pregunta</label>
        <input [(ngModel)]="newQ.q" name="q" class="input" placeholder="Ej: Cual es la capital de Francia?" required>
        <label>Categoria</label>
        <select [(ngModel)]="newQ.category" name="category" class="input">
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <label>Dificultad</label>
        <select [(ngModel)]="newQ.difficulty" name="difficulty" class="input">
          <option value="baja">baja</option>
          <option value="media">media</option>
          <option value="alta">alta</option>
        </select>
        <label>Opcion A</label>
        <input [(ngModel)]="newQ.options[0]" name="opt0" class="input" placeholder="Texto opcion A" required>
        <label>Opcion B</label>
        <input [(ngModel)]="newQ.options[1]" name="opt1" class="input" placeholder="Texto opcion B" required>
        <label>Opcion C</label>
        <input [(ngModel)]="newQ.options[2]" name="opt2" class="input" placeholder="Texto opcion C" required>
        <label>Opcion D</label>
        <input [(ngModel)]="newQ.options[3]" name="opt3" class="input" placeholder="Texto opcion D" required>
        <label>Respuesta correcta</label>
        <select [(ngModel)]="newQ.answer" name="answer" class="input">
          <option [value]="0">A</option>
          <option [value]="1">B</option>
          <option [value]="2">C</option>
          <option [value]="3">D</option>
        </select>
        <div class="form-actions">
          <button type="submit" class="btn" [disabled]="adding()">{{ adding() ? 'Guardando...' : 'Guardar pregunta' }}</button>
          <span *ngIf="addError()" class="error-msg">{{ addError() }}</span>
        </div>
      </form>
    </details>
  `,
})
export class QuestionBankFormComponent {
  @Input() categories: string[] = [];
  @Output() questionAdded = new EventEmitter<void>();

  newQ: QuestionItem = {
    q: '',
    options: ['', '', '', ''],
    answer: 0,
    category: 'cultura',
    difficulty: 'media',
  };
  adding = signal(false);
  addError = signal('');

  constructor(
    private questions: QuestionsService,
    private toast: ToastService,
  ) {}

  submitQuestion(): void {
    this.addError.set('');
    const q = this.newQ.q.trim();
    const opts = this.newQ.options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length !== 4) {
      this.addError.set('Completa la pregunta y las 4 opciones.');
      this.toast.error('Completa la pregunta y las 4 opciones.');
      return;
    }

    this.adding.set(true);
    this.questions.add({
      q,
      options: opts,
      answer: this.newQ.answer,
      category: this.newQ.category || (this.categories[0] || 'cultura'),
      difficulty: this.newQ.difficulty || 'media',
    })
      .then(() => {
        this.newQ = {
          q: '',
          options: ['', '', '', ''],
          answer: 0,
          category: this.newQ.category || (this.categories[0] || 'cultura'),
          difficulty: 'media',
        };
        this.toast.success('Pregunta guardada correctamente.');
        this.questionAdded.emit();
      })
      .catch((err: Error) => {
        const msg = err.message || 'Error al guardar';
        this.addError.set(msg);
        this.toast.error(msg);
      })
      .finally(() => this.adding.set(false));
  }
}
