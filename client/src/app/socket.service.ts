import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

export interface Player { name: string; score: number; }
export interface CurrentQ {
  index: number;
  total: number;
  q: string;
  options: string[];
  reveal: boolean;
  correct: number | null;
  startedAt?: number;
  durationMs?: number;
}
export interface GameSettings {
  questionTimeMs: number;
  questionCount: number;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  players = signal<Player[]>([]);
  currentQuestion = signal<CurrentQ | null>(null);
  counts = signal([0, 0, 0, 0]);
  leaderboard = signal<Player[]>([]);
  lobbyStarted = signal(false);

  constructor() {
    const base =
      environment.serverUrl ||
      `http://${typeof location !== 'undefined' ? location.hostname : 'localhost'}:3000`;
    this.socket = io(base, {
      path: '/socket.io',
      transports: ['websocket']
    });

    this.socket.on('lobby', ({ players, started }: { players: Player[]; started: boolean; }) => {
      this.players.set(players);
      this.lobbyStarted.set(started);
    });

    this.socket.on('question', (data: CurrentQ) => {
      this.currentQuestion.set(data);
      this.counts.set([0, 0, 0, 0]);
    });

    this.socket.on('host:answers', ({ counts }: { counts: number[]; }) => {
      this.counts.set(counts);
    });

    this.socket.on('reveal', ({ correct }: { correct: number; }) => {
      const cq = this.currentQuestion();
      if (cq) this.currentQuestion.set({ ...cq, reveal: true, correct });
    });

    this.socket.on('end', ({ leaderboard }: { leaderboard: Player[]; }) => {
      this.leaderboard.set(leaderboard);
    });
  }

  joinHost() { this.socket.emit('join', { role: 'host' }); }
  joinPlayer(name: string) { this.socket.emit('join', { role: 'player', name }); }
  hostStart(settings: GameSettings) { this.socket.emit('host:start', settings); }
  hostReveal() { this.socket.emit('host:reveal'); }
  hostNext() { this.socket.emit('host:next'); }
  answer(idx: number) { this.socket.emit('player:answer', idx); }
}
