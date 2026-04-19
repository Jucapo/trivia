import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

export interface Player { name: string; score: number; correctCount?: number; }
export interface CurrentQ {
  index: number;
  total: number;
  q: string;
  options: string[];
  reveal: boolean;
  correct: number | null;
  startedAt?: number;
  durationMs?: number;
  category?: string;
  difficulty?: string;
}
export interface GameSettings {
  questionTimeMs: number;
  questionCount: number;
  category?: string;
  categories?: string[];
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private pendingRole: 'host' | 'player' | null = null;
  private pendingName: string | null = null;

  players = signal<Player[]>([]);
  currentQuestion = signal<CurrentQ | null>(null);
  counts = signal([0, 0, 0, 0]);
  leaderboard = signal<Player[]>([]);
  lobbyStarted = signal(false);
  paused = signal(false);
  playerConfirmed = signal(false);
  hostAccepted = signal(false);
  hostRejected = signal(false);
  hostRejectedMessage = signal('');
  countdown = signal<{ startsAt: number; durationMs: number } | null>(null);

  constructor() {
    const base =
      environment.serverUrl ||
      `http://${typeof location !== 'undefined' ? location.hostname : 'localhost'}:3000`;
    this.socket = io(base, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Conectado:', this.socket.id);
      if (this.pendingRole) {
        console.log('[Socket] Re-enviando join tras reconexión:', this.pendingRole, this.pendingName);
        this.socket.emit('join', {
          role: this.pendingRole,
          ...(this.pendingName ? { name: this.pendingName } : {}),
        });
      }
    });

    this.socket.on('lobby', ({ players, started, paused }: { players: Player[]; started: boolean; paused?: boolean; }) => {
      this.players.set(players);
      this.lobbyStarted.set(started);
      if (paused !== undefined) this.paused.set(!!paused);
    });
    this.socket.on('paused', () => this.paused.set(true));
    this.socket.on('resumed', () => this.paused.set(false));

    this.socket.on('player:joined', () => {
      this.playerConfirmed.set(true);
    });

    this.socket.on('host:accepted', () => {
      this.hostAccepted.set(true);
      this.hostRejected.set(false);
      this.hostRejectedMessage.set('');
    });

    this.socket.on('host:rejected', ({ message }: { message: string }) => {
      this.hostRejected.set(true);
      this.hostAccepted.set(false);
      this.hostRejectedMessage.set(message);
    });

    this.socket.on('countdown', (data: { startsAt: number; durationMs: number }) => {
      this.countdown.set(data);
    });

    this.socket.on('question', (data: CurrentQ) => {
      this.countdown.set(null);
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
      this.paused.set(false);
    });

    this.socket.on('error', (data: { message?: string }) => {
      const message = data.message || 'Error desconocido';
      console.error('[Socket] Error:', message);
      this.errorCallbacks.forEach(callback => callback(message));
    });
  }

  private errorCallbacks: Set<(message: string) => void> = new Set();

  onError(callback: (message: string) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  joinHost() {
    this.pendingRole = 'host';
    this.pendingName = null;
    this.hostAccepted.set(false);
    this.hostRejected.set(false);
    this.hostRejectedMessage.set('');
    this.socket.emit('join', { role: 'host' });
  }

  joinPlayer(name: string) {
    this.pendingRole = 'player';
    this.pendingName = name;
    this.playerConfirmed.set(false);
    this.socket.emit('join', { role: 'player', name });
  }

  hostStart(settings: GameSettings) { this.socket.emit('host:start', settings); }
  hostReveal() { this.socket.emit('host:reveal'); }
  hostNext() { this.socket.emit('host:next'); }
  hostPause() { this.socket.emit('host:pause'); }
  hostResume() { this.socket.emit('host:resume'); }
  hostStop() { this.socket.emit('host:stop'); }
  answer(idx: number) { this.socket.emit('player:answer', idx); }
}
