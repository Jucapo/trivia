import { Component, OnDestroy, computed, effect, signal, type Signal } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService, Player } from '../../socket.service';

@Component({
  standalone: true,
  selector: 'app-player-page',
  imports: [DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe, FormsModule],
  styleUrls: ['./player.page.scss'],
  template: `
  <div class="player-container">
    <div class="player-card">
      <ng-container *ngIf="!joined; else game">
        <div class="player-join-screen">
          <div class="join-header">
            <h2 class="join-title">¡Únete a la partida!</h2>
            <p class="join-subtitle">Ingresa tu nombre para comenzar</p>
          </div>
          <div class="join-form">
            <label class="join-label">Tu nombre</label>
            <input 
              [(ngModel)]="name" 
              placeholder="Ej: Oscar / Jucapo / Cristian / Pipe" 
              class="input join-input"
              (keyup.enter)="join()">
            <button class="btn join-btn" (click)="join()">Unirme</button>
            <p class="badge join-badge">Juega desde cualquier lugar</p>
          </div>
        </div>
      </ng-container>

      <ng-template #game>
        <div class="player-game-wrap" *ngIf="current() as q; else wait">
          <div class="paused-overlay" *ngIf="paused()">
            <div class="paused-overlay-content">
              <div class="paused-spinner"></div>
              <p class="paused-overlay-msg">El host ha pausado la partida</p>
              <p class="paused-overlay-sub">Se reanudará en breve.</p>
            </div>
          </div>
          <div class="grid player-grid">
          <div class="qa-col">
            <div class="question-progress-header" *ngIf="!paused()">
              <span class="question-progress-text">Pregunta {{q.index+1}} de {{q.total}}</span>
              <span class="question-progress-pct">{{ gameProgressPct(q) }}% completado</span>
            </div>
            <div class="progress progress-game" *ngIf="!paused()"><div class="progress-bar progress-bar-game" [style.width.%]="gameProgressPct(q)"></div></div>

            <div class="header-row" *ngIf="!paused()">
              <h3>Pregunta</h3>
              <div class="badge time-badge" *ngIf="timeLeft(q) >= 0">⏱️ Tiempo: {{ timeLeft(q) / 1000 | number:'1.0-0' }}s</div>
            </div>

            <div class="progress" *ngIf="!paused()"><div class="progress-bar" [style.width.%]="progressPct(q)"></div></div>

            <div class="question-chips" *ngIf="q.category || q.difficulty">
              <span *ngIf="q.category" class="chip chip--category" [ngClass]="'chip--cat-' + (q.category || 'cultura')">
                <span class="chip-icon">{{ categoryIcon(q.category) }}</span>{{ (q.category || 'cultura') | titlecase }}
              </span>
              <span *ngIf="q.difficulty" class="chip chip--difficulty" [ngClass]="'chip--diff-' + (q.difficulty || 'media')">
                <span class="chip-dot"></span>{{ (q.difficulty || 'media') | titlecase }}
              </span>
            </div>
            <p class="question">{{q.q}}</p>

            <div class="grid two options-grid" *ngIf="!paused()">
              <button
                class="btn secondary option-btn"
                *ngFor="let opt of q.options; let i = index"
                [disabled]="q.reveal"
                [ngClass]="optionClass(i, q)"
                (click)="pick(i, q.reveal)">
                <span class="option-letter">{{ 'ABCD'[i] }}</span>
                <span class="option-text">{{ opt | titlecase }}</span>
              </button>
            </div>

            <p *ngIf="q.reveal" class="badge ok reveal-badge">✅ Correcta: {{ 'ABCD'[q.correct ?? 0] }}</p>
          </div>

          <div class="lb-col">
            <div class="leaderboard-card">
              <h3 class="leaderboard-title">🏆 Tabla de posiciones</h3>
              <ul class="list leaderboard-list">
                <li *ngFor="let p of sortedPlayers(); let i = index" class="list-item leaderboard-item" [class.top-three]="i < 3">
                  <div class="leaderboard-rank">
                    <span class="rank-number" [class.rank-gold]="i === 0" [class.rank-silver]="i === 1" [class.rank-bronze]="i === 2">{{i+1}}</span>
                    <span class="player-name">{{p.name}}</span>
                  </div>
                  <span class="list-item-badges">
                    <span class="badge score-badge">Pts: {{p.score}}</span>
                    <span class="chip chip--correct" *ngIf="(p.correctCount ?? 0) > 0"><span class="chip-dot"></span>{{ p.correctCount }} correctas</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
          </div>
        </div>

        <ng-template #wait>
          <div class="player-wait-screen">
            <div class="wait-content">
              <div class="wait-icon">⏳</div>
              <h2 class="wait-title">Esperando al host</h2>
              <p class="wait-message">El host iniciará la partida en breve...</p>
              <div class="wait-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </ng-template>
      </ng-template>
    </div>
  </div>
  `
})
export class PlayerPage implements OnDestroy {
  name = '';
  joined = false;
  get current() { return this.sock.currentQuestion; }
  get paused() { return this.sock.paused; }

  selected: number | null = null;

  now = signal(Date.now());
  private timer: any;

  sortedPlayers!: Signal<Player[]>;

  constructor(private sock: SocketService) {
    this.sortedPlayers = computed(() => [...this.sock.players()].sort((a, b) => b.score - a.score));
    this.timer = setInterval(() => this.now.set(Date.now()), 150);
    effect(() => {
      const q = this.current();
      if (q) this.selected = null;
    });
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  join() {
    const n = this.name.trim() || 'Jugador';
    this.sock.joinPlayer(n);
    this.joined = true;
  }

  pick(i: number, reveal: boolean) {
    if (reveal) return;
    this.selected = i;
    this.sock.answer(i);
  }

  optionClass(i: number, q: any) {
    const c: string[] = [];
    const chosen = this.selected === i;
    if (!q?.reveal) {
      if (chosen) c.push('chosen');
      return c;
    }
    if (chosen && q.correct === i) c.push('chosen', 'right');
    else if (chosen && q.correct !== i) c.push('chosen', 'wrong');
    return c;
  }

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

  gameProgressPct(q: any): number {
    if (!q?.total || q.total < 1) return 0;
    const current = (q.index ?? 0) + 1;
    return Math.round((current / q.total) * 100);
  }

  categoryIcon(cat: string): string {
    const key = (cat || 'cultura').toLowerCase();
    const defaults: Record<string, string> = {
      cultura: '📚', historia: '🏛️', geografia: '🌍',
      entretenimiento: '🎬', videojuegos: '🎮', musica: '🎵',
    };
    return defaults[key] || '📁';
  }
}
