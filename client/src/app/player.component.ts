import { Component, OnDestroy, signal, computed, effect, type Signal } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService, Player } from './socket.service';

@Component({
  standalone: true,
  selector: 'app-player',
  imports: [DecimalPipe, NgClass, NgFor, NgIf, FormsModule],
  template: `
  <div class="card">
    <ng-container *ngIf="!joined; else game">
      <h2>🎮 Unirse</h2>
      <label>Tu nombre</label>
      <input [(ngModel)]="name" placeholder="Ej: Óscar / Jucapo / Cristian / Pipe" class="input">
      <button class="btn" (click)="join()">Unirme</button>
      <p class="badge" style="margin-top:6px">Misma Wi-Fi que el host.</p>
    </ng-container>

    <ng-template #game>
      <div class="grid grid-2 player-grid" *ngIf="current() as q; else wait">
        <div class="qa-col">
          <div class="header-row">
            <h3>Pregunta</h3>
            <div class="badge" *ngIf="timeLeft(q) >= 0">⏱ {{ timeLeft(q) / 1000 | number:'1.0-0' }}s</div>
          </div>

          <div class="progress"><div class="progress-bar" [style.width.%]="progressPct(q)"></div></div>

          <p class="question">{{q.q}}</p>

          <div class="grid two options-grid">
            <button
              class="btn secondary option-btn"
              *ngFor="let opt of q.options; let i = index"
              [disabled]="q.reveal"
              [ngClass]="optionClass(i, q)"
              (click)="pick(i, q.reveal)">
              {{ 'ABCD'[i] }}) {{opt}}
            </button>
          </div>

          <p *ngIf="q.reveal" class="badge ok">Correcta: {{ 'ABCD'[q.correct ?? 0] }}</p>
        </div>

        <div class="lb-col">
          <h3>🏆 Tabla de posiciones</h3>
          <ul class="list">
            <li *ngFor="let p of sortedPlayers(); let i = index" class="list-item">
              <span>{{i+1}}. {{p.name}}</span><span class="badge">Pts: {{p.score}}</span>
            </li>
          </ul>
        </div>
      </div>

      <ng-template #wait>
        <p class="badge">Esperando a que el host inicie…</p>
      </ng-template>
    </ng-template>
  </div>
  `,
  styles: [`
    .option-btn.chosen {
      background: #2563eb !important;
      color: #ffffff !important;
      border: 2px solid #1d4ed8 !important;
      filter: none;
      position: relative;
    }
    .option-btn.chosen.right {
      background: #16a34a !important;
      border-color: #15803d !important;
      color: #fff !important;
      box-shadow: 0 0 14px rgba(22,163,74,.25);
    }
    .option-btn.chosen.wrong {
      background: #ef4444 !important;
      border-color: #b91c1c !important;
      color: #fff !important;
      box-shadow: 0 0 14px rgba(239,68,68,.25);
    }

    @media (max-width: 820px) {
      .player-grid { grid-template-columns: 1fr; }
      .lb-col { margin-top: 16px; }
    }
  `]
})
export class PlayerComponent implements OnDestroy {
  name = '';
  joined = false;
  get current() { return this.sock.currentQuestion; }

  selected: number | null = null;

  now = signal(Date.now());
  private timer: any;

  sortedPlayers!: Signal<Player[]>;

  constructor(private sock: SocketService) {
    this.sortedPlayers = computed(() =>
      [...this.sock.players()].sort((a, b) => b.score - a.score)
    );
    this.timer = setInterval(() => this.now.set(Date.now()), 150);
    effect(() => {
      const q = this.current();
      if (q) this.selected = null;
    });
  }

  ngOnDestroy(){ if (this.timer) clearInterval(this.timer); }

  join(){
    const n = this.name.trim() || 'Jugador';
    this.sock.joinPlayer(n);
    this.joined = true;
  }

  pick(i:number, reveal:boolean){
    if (reveal) return;
    this.selected = i;
    this.sock.answer(i);
  }

  optionClass(i:number, q:any){
    const c: string[] = [];
    const chosen = this.selected === i;
    if (!q?.reveal) {
      if (chosen) c.push('chosen');
      return c;
    }
    if (chosen && q.correct === i) c.push('chosen','right');
    else if (chosen && q.correct !== i) c.push('chosen','wrong');
    return c;
  }

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
