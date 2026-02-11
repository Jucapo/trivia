import { Component, OnDestroy, signal } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from './socket.service';
import { QuestionsService, type QuestionItem } from './questions.service';

@Component({
  standalone: true,
  selector: 'app-host',
  imports: [DecimalPipe, NgFor, NgIf, FormsModule],
  template: `
  <div class="card host-panel">
    <h2>🎛️ Host</h2>
    <div class="share-row">
      <span class="badge">Comparte:</span>
      <code class="share-url">{{ shareUrl }}</code>
      <button type="button" class="btn btn-copy" (click)="copyLink()" [class.copied]="copied">{{ copied ? '✓ Copiado' : 'Copiar' }}</button>
    </div>

    <div class="grid grid-2">
      <div class="host-col">
        <h3>Jugadores</h3>
        <ul class="list">
          <li *ngFor="let p of players()" class="list-item">
            <span>{{p.name}}</span><span class="badge">Pts: {{p.score}}</span>
          </li>
        </ul>
      </div>

      <div class="host-col">
        <h3>Estado</h3>
        <p class="badge">{{ lobbyStarted() ? 'En curso' : 'En lobby' }}</p>
        <div *ngIf="counts() as c" class="grid answers-grid">
          <div class="card soft">A: {{c[0]}}</div>
          <div class="card soft">B: {{c[1]}}</div>
          <div class="card soft">C: {{c[2]}}</div>
          <div class="card soft">D: {{c[3]}}</div>
        </div>
      </div>
    </div>

    <div class="host-actions">
      <button class="btn" (click)="start()">▶️ Iniciar</button>
      <button class="btn secondary" (click)="next()">➡️ Siguiente</button>
      <button class="btn secondary" (click)="reveal()">👁 Revelar</button>
    </div>
  </div>

  <div class="card host-panel" *ngIf="current() as q">
    <div class="header-row">
      <h3>Pregunta {{q.index+1}} / {{q.total}}</h3>
      <div class="badge" *ngIf="timeLeft(q) >= 0">⏱ {{ timeLeft(q) / 1000 | number:'1.0-0' }}s</div>
    </div>

    <div class="progress"><div class="progress-bar" [style.width.%]="progressPct(q)"></div></div>

    <p class="question">{{q.q}}</p>
    <ul>
      <li *ngFor="let opt of q.options; let i = index">{{ 'ABCD'[i] }}) {{opt}}</li>
    </ul>
    <p *ngIf="q.reveal" class="badge ok">Correcta: {{ 'ABCD'[q.correct ?? 0] }}</p>
  </div>

  <div class="card host-panel" *ngIf="leaderboard().length > 0">
    <h3>🏆 Resultados</h3>
    <ul class="list">
      <li *ngFor="let p of leaderboard(); let i = index" class="list-item">
        <span>{{i+1}}. {{p.name}}</span><span class="badge">Pts: {{p.score}}</span>
      </li>
    </ul>
  </div>

  <div class="card host-panel add-question-panel">
    <h3>➕ Añadir pregunta al banco</h3>
    <p class="muted">Las preguntas que añadas quedarán disponibles para partidas futuras.</p>
    <form class="add-question-form" (ngSubmit)="submitQuestion()">
      <label>Pregunta</label>
      <input [(ngModel)]="newQ.q" name="q" class="input" placeholder="Ej: ¿Cuál es la capital de Francia?" required>
      <label>Opción A (correcta si eliges 0)</label>
      <input [(ngModel)]="newQ.options[0]" name="opt0" class="input" placeholder="Texto opción A" required>
      <label>Opción B</label>
      <input [(ngModel)]="newQ.options[1]" name="opt1" class="input" placeholder="Texto opción B" required>
      <label>Opción C</label>
      <input [(ngModel)]="newQ.options[2]" name="opt2" class="input" placeholder="Texto opción C" required>
      <label>Opción D</label>
      <input [(ngModel)]="newQ.options[3]" name="opt3" class="input" placeholder="Texto opción D" required>
      <label>Respuesta correcta</label>
      <select [(ngModel)]="newQ.answer" name="answer" class="input">
        <option [value]="0">A</option>
        <option [value]="1">B</option>
        <option [value]="2">C</option>
        <option [value]="3">D</option>
      </select>
      <div class="form-actions">
        <button type="submit" class="btn" [disabled]="adding">{{ adding ? 'Guardando…' : 'Guardar pregunta' }}</button>
        <span *ngIf="addError" class="error-msg">{{ addError }}</span>
        <span *ngIf="addSuccess" class="success-msg">{{ addSuccess }}</span>
      </div>
    </form>
  </div>
  `
})
export class HostComponent implements OnDestroy {
  get players() { return this.sock.players; }
  get lobbyStarted() { return this.sock.lobbyStarted; }
  get counts() { return this.sock.counts; }
  get current() { return this.sock.currentQuestion; }
  get leaderboard() { return this.sock.leaderboard; }

  now = signal(Date.now());
  private timer: any;
  shareUrl = '';
  copied = false;
  newQ: QuestionItem = { q: '', options: ['', '', '', ''], answer: 0 };
  adding = false;
  addError = '';
  addSuccess = '';

  constructor(
    private sock: SocketService,
    private questions: QuestionsService,
  ) {
    this.sock.joinHost();
    this.timer = setInterval(() => this.now.set(Date.now()), 150);
    if (typeof location !== 'undefined') {
      this.shareUrl = `${location.origin}/play`;
    } else {
      this.shareUrl = 'http://localhost:4200/play';
    }
  }
  ngOnDestroy(){ if (this.timer) clearInterval(this.timer); }

  copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  submitQuestion() {
    this.addError = '';
    this.addSuccess = '';
    const q = this.newQ.q.trim();
    const opts = this.newQ.options.map(o => o.trim()).filter(Boolean);
    if (!q || opts.length !== 4) {
      this.addError = 'Completa la pregunta y las 4 opciones.';
      return;
    }
    this.adding = true;
    this.questions.add({ q, options: opts, answer: this.newQ.answer })
      .then(() => {
        this.addSuccess = 'Pregunta guardada.';
        this.newQ = { q: '', options: ['', '', '', ''], answer: 0 };
        setTimeout(() => (this.addSuccess = ''), 3000);
      })
      .catch((err: Error) => { this.addError = err.message || 'Error al guardar'; })
      .finally(() => { this.adding = false; });
  }

  start(){ this.sock.hostStart(); }
  next(){ this.sock.hostNext(); }
  reveal(){ this.sock.hostReveal(); }

  timeLeft(q:any){
    if (!q?.startedAt || !q?.durationMs) return -1;
    const ms = q.startedAt + q.durationMs - this.now();
    return Math.max(0, ms);
  }
  progressPct(q:any){
    if (!q?.startedAt || !q?.durationMs) return 0;
    const elapsed = this.now() - q.startedAt;
    const pct = (elapsed / q.durationMs) * 100;
    return Math.min(100, Math.max(0, pct));
  }
}
