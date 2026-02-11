import { Component, OnDestroy, signal } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../socket.service';
import { QuestionsService } from '../../questions.service';
import { QuestionBankFormComponent } from '../../components/question-bank-form/question-bank-form.component';

@Component({
  standalone: true,
  selector: 'app-host-page',
  imports: [DecimalPipe, NgFor, NgIf, FormsModule, QuestionBankFormComponent],
  template: `
  <div class="card host-panel">
    <h2>ðŸŽ›ï¸ Host</h2>
    <div class="share-row">
      <span class="badge">Comparte:</span>
      <code class="share-url">{{ shareUrl }}</code>
      <button type="button" class="btn btn-copy" (click)="copyLink()" [class.copied]="copied()">{{ copied() ? 'âœ“ Copiado' : 'Copiar' }}</button>
    </div>
    <div class="game-settings">
      <h3>âš™ï¸ ConfiguraciÃ³n de partida</h3>
      <div class="grid grid-2">
        <div>
          <label>Tiempo por pregunta (segundos)</label>
          <input type="number" class="input" [(ngModel)]="gameTimeSec" min="5" max="60">
        </div>
        <div>
          <label>Cantidad de preguntas</label>
          <input type="number" class="input" [(ngModel)]="gameQuestionCount" min="1" [max]="totalQuestionCount() || 200">
        </div>
      </div>
      <p class="muted no-margin">Banco disponible: {{ totalQuestionCount() || '...' }} preguntas.</p>
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
      <button class="btn" (click)="start()">â–¶ï¸ Iniciar</button>
      <button class="btn secondary" (click)="next()">âž¡ï¸ Siguiente</button>
      <button class="btn secondary" (click)="reveal()">ðŸ‘ Revelar</button>
    </div>
  </div>

  <div class="card host-panel" *ngIf="current() as q">
    <div class="header-row">
      <h3>Pregunta {{q.index+1}} / {{q.total}}</h3>
      <div class="badge" *ngIf="timeLeft(q) >= 0">â± {{ timeLeft(q) / 1000 | number:'1.0-0' }}s</div>
    </div>

    <div class="progress"><div class="progress-bar" [style.width.%]="progressPct(q)"></div></div>

    <p class="question">{{q.q}}</p>
    <ul>
      <li *ngFor="let opt of q.options; let i = index">{{ 'ABCD'[i] }}) {{opt}}</li>
    </ul>
    <p *ngIf="q.reveal" class="badge ok">Correcta: {{ 'ABCD'[q.correct ?? 0] }}</p>
  </div>

  <div class="card host-panel" *ngIf="leaderboard().length > 0">
    <h3>ðŸ† Resultados</h3>
    <ul class="list">
      <li *ngFor="let p of leaderboard(); let i = index" class="list-item">
        <span>{{i+1}}. {{p.name}}</span><span class="badge">Pts: {{p.score}}</span>
      </li>
    </ul>
  </div>

  <app-question-bank-form (questionAdded)="onQuestionAdded()"></app-question-bank-form>
  `
})
export class HostPage implements OnDestroy {
  get players() { return this.sock.players; }
  get lobbyStarted() { return this.sock.lobbyStarted; }
  get counts() { return this.sock.counts; }
  get current() { return this.sock.currentQuestion; }
  get leaderboard() { return this.sock.leaderboard; }

  now = signal(Date.now());
  private timer: any;
  shareUrl = '';
  copied = signal(false);
  gameTimeSec = 15;
  gameQuestionCount = 10;
  totalQuestionCount = signal(0);

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
    this.questions.list()
      .then((items) => {
        this.totalQuestionCount.set(items.length);
        this.gameQuestionCount = Math.max(1, Math.min(this.gameQuestionCount, items.length || 10));
      })
      .catch(() => {
        this.totalQuestionCount.set(0);
      });
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  onQuestionAdded(): void {
    this.totalQuestionCount.update((n) => n + 1);
  }

  copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  start() {
    const timeMs = Math.max(5, Math.min(60, Number(this.gameTimeSec) || 15)) * 1000;
    const maxFromBank = this.totalQuestionCount();
    const desiredCount = Math.max(1, Number(this.gameQuestionCount) || 10);
    const safeCount = maxFromBank > 0 ? Math.min(desiredCount, maxFromBank) : desiredCount;
    this.sock.hostStart({ questionTimeMs: timeMs, questionCount: safeCount });
  }

  next() { this.sock.hostNext(); }
  reveal() { this.sock.hostReveal(); }

  timeLeft(q: any) {
    if (!q?.startedAt || !q?.durationMs) return -1;
    const ms = q.startedAt + q.durationMs - this.now();
    return Math.max(0, ms);
  }

  progressPct(q: any) {
    if (!q?.startedAt || !q?.durationMs) return 0;
    const elapsed = this.now() - q.startedAt;
    const pct = (elapsed / q.durationMs) * 100;
    return Math.min(100, Math.max(0, pct));
  }
}
