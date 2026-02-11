import { Component, OnDestroy, computed, effect, signal, type Signal } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService, Player } from '../../socket.service';

@Component({
  standalone: true,
  selector: 'app-player-page',
  imports: [DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe, FormsModule],
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
          <div class="grid grid-2 player-grid">
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
  `,
  styles: [`
    /* Container con fondo cards */
    .player-container {
      min-height: 100vh;
      padding: 24px 20px;
      background: 
        radial-gradient(ellipse at top left, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at bottom right, rgba(118, 75, 162, 0.12) 0%, transparent 50%),
        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      position: relative;
    }
    
    .player-container::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(118, 75, 162, 0.08) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    .player-card {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Pantalla de unirse */
    .player-join-screen {
      text-align: center;
      padding: 48px 32px;
    }

    .join-header {
      margin-bottom: 32px;
    }

    .join-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .join-subtitle {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }

    .join-form {
      max-width: 400px;
      margin: 0 auto;
    }

    .join-label {
      display: block;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
      text-align: left;
    }

    .join-input {
      margin-bottom: 20px;
    }

    .join-btn {
      width: 100%;
      margin-bottom: 16px;
      padding: 16px;
      font-size: 16px;
    }

    .join-badge {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border-color: rgba(102, 126, 234, 0.2);
    }

    /* Pantalla de espera */
    .player-wait-screen {
      padding: 80px 32px;
      text-align: center;
    }

    .wait-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .wait-icon {
      font-size: 4rem;
      margin-bottom: 24px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .wait-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1e293b;
    }

    .wait-message {
      color: #64748b;
      font-size: 1rem;
      margin-bottom: 32px;
    }

    .wait-dots {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .wait-dots span {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #667eea;
      animation: bounce 1.4s ease-in-out infinite;
    }

    .wait-dots span:nth-child(1) { animation-delay: 0s; }
    .wait-dots span:nth-child(2) { animation-delay: 0.2s; }
    .wait-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
      40% { transform: translateY(-12px); opacity: 1; }
    }

    /* Pantalla de juego */
    .player-game-wrap { 
      position: relative; 
      min-height: 120px; 
    }

    .paused-overlay {
      position: absolute; 
      inset: 0; 
      z-index: 10;
      background: rgba(15, 23, 42, 0.92); 
      border-radius: inherit;
      display: flex; 
      align-items: center; 
      justify-content: center;
      backdrop-filter: blur(8px);
    }

    .paused-overlay-content { 
      text-align: center; 
      color: #e2e8f0; 
      padding: 32px; 
    }

    .paused-spinner {
      width: 56px; 
      height: 56px; 
      margin: 0 auto 20px;
      border: 5px solid rgba(226, 232, 240, 0.2);
      border-top-color: #f59e0b;
      border-radius: 50%; 
      animation: spin 0.9s linear infinite;
    }

    @keyframes spin { 
      to { transform: rotate(360deg); } 
    }

    .paused-overlay-msg { 
      font-size: 1.25rem; 
      font-weight: 700; 
      margin: 0 0 8px; 
      color: #fef3c7; 
    }

    .paused-overlay-sub { 
      font-size: 0.95rem; 
      opacity: 0.9; 
      margin: 0; 
    }

    .time-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
      font-weight: 600;
    }

    /* Opciones de respuesta */
    .option-btn {
      position: relative;
      padding: 16px 20px;
      text-align: left;
      transition: all 0.2s ease;
      border: 2px solid #e2e8f0;
    }

    .option-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }

    .option-letter {
      display: inline-block;
      width: 32px;
      height: 32px;
      line-height: 32px;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border-radius: 8px;
      font-weight: 700;
      margin-right: 12px;
      text-align: center;
      flex-shrink: 0;
    }

    .option-text {
      flex: 1;
    }

    .option-btn.chosen {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: #ffffff !important;
      border: 2px solid #667eea !important;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
    }

    .option-btn.chosen .option-letter {
      background: rgba(255, 255, 255, 0.3);
      color: #fff;
    }

    .option-btn.chosen.right {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%) !important;
      border-color: #22c55e !important;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4) !important;
    }

    .option-btn.chosen.wrong {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%) !important;
      border-color: #ef4444 !important;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4) !important;
    }

    .reveal-badge {
      margin-top: 20px;
      font-size: 14px;
      padding: 10px 16px;
    }

    /* Leaderboard */
    .leaderboard-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .leaderboard-title {
      margin-bottom: 20px;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .leaderboard-list {
      margin: 0;
    }

    .leaderboard-item {
      padding: 14px 16px;
      border-radius: 12px;
      margin-bottom: 8px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(226, 232, 240, 0.6);
      transition: all 0.2s ease;
    }

    .leaderboard-item:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .leaderboard-item.top-three {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-color: rgba(102, 126, 234, 0.2);
    }

    .leaderboard-rank {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rank-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #e2e8f0;
      color: #64748b;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }

    .rank-gold {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
    }

    .rank-silver {
      background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(148, 163, 184, 0.3);
    }

    .rank-bronze {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
    }

    .player-name {
      font-weight: 600;
      color: #1e293b;
    }

    .score-badge {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border-color: rgba(102, 126, 234, 0.2);
      font-weight: 600;
    }

    @media (max-width: 820px) {
      .player-grid { grid-template-columns: 1fr; }
      .lb-col { margin-top: 24px; }
      .player-container { padding: 16px 12px; }
      .join-title { font-size: 1.5rem; }
      .wait-title { font-size: 1.5rem; }
    }
  `]
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
