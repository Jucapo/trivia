import { Component, OnDestroy, signal } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { SocketService } from './socket.service';

@Component({
  standalone: true,
  selector: 'app-host',
  imports: [DecimalPipe, NgFor, NgIf],
  template: `
  <div class="card host-panel">
    <h2>🎛️ Host</h2>
    <p class="badge">Comparte: <span class="kbd">http://{{host}}:4200/play</span></p>

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
  host = typeof location !== 'undefined' ? location.hostname : 'localhost';

  constructor(private sock: SocketService) {
    this.sock.joinHost();
    this.timer = setInterval(() => this.now.set(Date.now()), 150);
  }
  ngOnDestroy(){ if (this.timer) clearInterval(this.timer); }

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
