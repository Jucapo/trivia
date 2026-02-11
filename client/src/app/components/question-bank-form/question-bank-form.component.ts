import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { QuestionsService, type QuestionItem } from '../../questions.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  selector: 'app-question-bank-form',
  imports: [FormsModule, NgIf],
  template: `
    <details class="card host-panel add-question-panel">
      <summary>âž• AÃ±adir pregunta al banco</summary>
      <p class="muted">Las preguntas que aÃ±adas quedarÃ¡n disponibles para partidas futuras.</p>
      <form class="add-question-form" (ngSubmit)="submitQuestion()">
        <label>Pregunta</label>
        <input [(ngModel)]="newQ.q" name="q" class="input" placeholder="Ej: Â¿CuÃ¡l es la capital de Francia?" required>
        <label>OpciÃ³n A (correcta si eliges 0)</label>
        <input [(ngModel)]="newQ.options[0]" name="opt0" class="input" placeholder="Texto opciÃ³n A" required>
        <label>OpciÃ³n B</label>
        <input [(ngModel)]="newQ.options[1]" name="opt1" class="input" placeholder="Texto opciÃ³n B" required>
        <label>OpciÃ³n C</label>
        <input [(ngModel)]="newQ.options[2]" name="opt2" class="input" placeholder="Texto opciÃ³n C" required>
        <label>OpciÃ³n D</label>
        <input [(ngModel)]="newQ.options[3]" name="opt3" class="input" placeholder="Texto opciÃ³n D" required>
        <label>Respuesta correcta</label>
        <select [(ngModel)]="newQ.answer" name="answer" class="input">
          <option [value]="0">A</option>
          <option [value]="1">B</option>
          <option [value]="2">C</option>
          <option [value]="3">D</option>
        </select>
        <div class="form-actions">
          <button type="submit" class="btn" [disabled]="adding()">{{ adding() ? 'Guardandoâ€¦' : 'Guardar pregunta' }}</button>
          <span *ngIf="addError()" class="error-msg">{{ addError() }}</span>
        </div>
      </form>
    </details>
  `,
})
export class QuestionBankFormComponent {
  @Output() questionAdded = new EventEmitter<void>();

  newQ: QuestionItem = { q: '', options: ['', '', '', ''], answer: 0 };
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
    this.questions.add({ q, options: opts, answer: this.newQ.answer })
      .then(() => {
        this.newQ = { q: '', options: ['', '', '', ''], answer: 0 };
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
