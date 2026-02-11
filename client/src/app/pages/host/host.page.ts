import { Component, OnDestroy, signal } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../socket.service';
import { QuestionsService } from '../../questions.service';
import { CategoryMultiSelectComponent } from '../../components/category-multi-select/category-multi-select.component';
import { ToastService } from '../../services/toast.service';
import { AccordionComponent } from '../../components/accordion/accordion.component';

@Component({
  standalone: true,
  selector: 'app-host-page',
  imports: [DecimalPipe, NgFor, NgIf, NgClass, TitleCasePipe, FormsModule, CategoryMultiSelectComponent, RouterLink, AccordionComponent],
  styleUrls: ['./host.page.scss'],
  template: `
  <a routerLink="/" class="back-link">← Volver a inicio</a>

  <div class="host-share-section">
    <div class="share-row">
      <span class="badge">Comparte:</span>
      <code class="share-url">{{ shareUrl }}</code>
      <div class="share-actions">
        <button
          type="button"
          class="btn share-btn share-btn-open"
          (click)="openShare()"
          [disabled]="!shareUrl"
          title="Abrir enlace en una nueva pestaña"
          aria-label="Abrir enlace en una nueva pestaña">
          ↗
        </button>
        <button
          type="button"
          class="btn share-btn btn-copy"
          (click)="copyLink()"
          [class.copied]="copied()"
          title="Copiar enlace de jugadores"
          aria-label="Copiar enlace de jugadores">
          📋
        </button>
      </div>
    </div>
  </div>

  <div class="host-main-layout">
  <app-accordion
    [open]="!lobbyStarted()"
    title="Configuracion">
    <div class="game-settings">
      <h3>Configuracion de partida</h3>
      <div class="grid grid-2">
        <div>
          <label>Tiempo por pregunta (segundos) <span class="required">*</span></label>
          <input
            type="number"
            class="input"
            [(ngModel)]="gameTimeSec"
            min="3"
            max="60"
            placeholder="3-60"
            required>
          <p *ngIf="timeError()" class="error-msg">{{ timeError() }}</p>
        </div>
        <div>
          <label>Cantidad de preguntas <span class="required">*</span></label>
          <input type="number" class="input" [(ngModel)]="gameQuestionCount" min="1" [max]="totalQuestionCount() || 200" placeholder="1" required>
        </div>
        <div class="category-select-col">
          <label>Categoria de la partida <span class="required">*</span></label>
          <app-category-multi-select
            [options]="categories()"
            [selected]="selectedCategories()"
            [categoryIcons]="categoryIcons()"
            (selectedChange)="onCategoriesChange($event)">
          </app-category-multi-select>
        </div>
      </div>
      <p class="muted no-margin bank-info">Banco disponible: {{ totalQuestionCount() || '...' }} preguntas.</p>
    </div>
  </app-accordion>

  <app-accordion
    [open]="true"
    title="Jugadores ingresados">
    <div class="players-layout">
      <div class="players-list">
        <ul class="list" *ngIf="players().length > 0">
          <li *ngFor="let p of players()" class="list-item">
            <span>{{p.name}}</span>
            <span class="list-item-badges">
              <span class="badge">Pts: {{p.score}}</span>
              <span class="chip chip--correct" *ngIf="(p.correctCount ?? 0) > 0"><span class="chip-dot"></span>{{ p.correctCount }} ✓</span>
            </span>
          </li>
        </ul>
        <p *ngIf="players().length === 0" class="muted">Ningun jugador ha ingresado. Comparte el enlace para que se unan.</p>
      </div>
      <div class="host-status-card">
        <div class="host-status-row">
          <h3>Estado</h3>
          <p class="badge status-pill">
            {{ lobbyStarted() && paused() ? 'Pausado' : lobbyStarted() ? 'En curso' : 'En lobby' }}
          </p>
        </div>
        <ng-container *ngIf="counts() as c">
          <p class="muted status-answers">
            Respuestas: {{ answeredCount(c) }} / {{ players().length }}
          </p>
          <div class="grid answers-grid">
            <div class="card soft">A: {{c[0]}}</div>
            <div class="card soft">B: {{c[1]}}</div>
            <div class="card soft">C: {{c[2]}}</div>
            <div class="card soft">D: {{c[3]}}</div>
          </div>
        </ng-container>
      </div>
    </div>
  </app-accordion>

  <div class="host-right-col">
  <app-accordion
    *ngIf="current() as q"
    [open]="true"
    [title]="'Pregunta actual (' + (q.index + 1) + ' de ' + q.total + ')'"
    [extraClasses]="'question-card-accordion'">
    <div class="question-progress-header" *ngIf="!paused()">
      <span class="question-progress-text">Pregunta {{q.index+1}} de {{q.total}}</span>
      <span class="question-progress-pct">{{ gameProgressPct(q) }}% completado</span>
    </div>
    <div class="progress progress-game" *ngIf="!paused()"><div class="progress-bar progress-bar-game" [style.width.%]="gameProgressPct(q)"></div></div>

    <div class="header-row">
      <h3>Pregunta</h3>
      <div class="badge" *ngIf="!paused() && timeLeft(q) >= 0">Tiempo: {{ timeLeft(q) / 1000 | number:'1.0-0' }}s</div>
      <div class="badge" *ngIf="paused()">Pausado</div>
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
    <ul>
      <li *ngFor="let opt of q.options; let i = index">{{ 'ABCD'[i] }}) {{ opt | titlecase }}</li>
    </ul>
    <p *ngIf="q.reveal" class="badge ok">Correcta: {{ 'ABCD'[q.correct ?? 0] }}</p>
    <div class="host-actions" *ngIf="lobbyStarted() && !paused()">
      <button class="btn secondary" (click)="reveal()">Revelar</button>
      <button class="btn secondary" (click)="next()">Siguiente</button>
    </div>
  </app-accordion>

  <div class="card host-panel host-section" *ngIf="leaderboard().length > 0">
    <h3>Resultados</h3>
    <ul class="list">
      <li *ngFor="let p of leaderboard(); let i = index" class="list-item">
        <span>{{i+1}}. {{p.name}}</span>
        <span class="list-item-badges">
          <span class="badge">Pts: {{p.score}}</span>
          <span class="chip chip--correct"><span class="chip-dot"></span>{{ p.correctCount ?? 0 }} ✓</span>
        </span>
      </li>
    </ul>
  </div>
  </div>
  </div>
  <div class="host-float-start" *ngIf="!lobbyStarted()">
    <button
      class="btn btn-float btn-float-primary"
      (click)="start()"
      [disabled]="!canStart()"
      title="Iniciar partida"
      aria-label="Iniciar partida">
      <span class="icon-play">&#9654;</span>
    </button>
  </div>
  <div class="host-float-start host-float-actions" *ngIf="lobbyStarted() && !paused()">
    <button
      class="btn btn-float btn-float-pause"
      (click)="pause()"
      title="Pausar partida"
      aria-label="Pausar partida">
      <span class="icon-pause">&#9208;</span>
    </button>
  </div>
  <div class="host-float-start host-float-actions host-float-two" *ngIf="lobbyStarted() && paused()">
    <button
      class="btn btn-float btn-float-resume"
      (click)="resume()"
      title="Reanudar partida"
      aria-label="Reanudar partida">
      <span class="icon-play">&#9654;</span>
    </button>
    <button
      class="btn btn-float btn-float-danger"
      (click)="stopGame()"
      title="Reiniciar partida"
      aria-label="Reiniciar partida">
      <span class="icon-restart">&#8635;</span>
    </button>
  </div>
  `
})
export class HostPage implements OnDestroy {
  get players() { return this.sock.players; }
  get lobbyStarted() { return this.sock.lobbyStarted; }
  get counts() { return this.sock.counts; }
  get current() { return this.sock.currentQuestion; }
  get leaderboard() { return this.sock.leaderboard; }
  get paused() { return this.sock.paused; }

  now = signal(Date.now());
  private timer: any;
  shareUrl = '';
  copied = signal(false);
  gameTimeSec = 15;
  gameQuestionCount = 10;
  totalQuestionCount = signal(0);
  categories = signal<string[]>(['cultura', 'historia', 'geografia', 'entretenimiento', 'videojuegos', 'musica']);
  categoryCounts = signal<Record<string, number>>({});
  categoryIcons = signal<Record<string, string>>({});
  selectedCategories = signal<string[]>(['todas']);
  newCategoryName = '';
  newCategoryIcon = '';
  addingCategory = signal(false);
  availableCategoryIcons = ['📚','🏛️','🌍','🎬','🎮','🎵','⚽','🏀','🎾','🎨','🔬','📖','✈️','🍕','🎭','🎪','🏥','💼','🔧','📁'];

  answeredCount(counts: number[]): number {
    if (!counts) return 0;
    return counts.reduce((sum, n) => sum + (n || 0), 0);
  }

  canStart(): boolean {
    if (this.lobbyStarted()) return false;
    if (this.players().length === 0) return false;
    const cats = this.selectedCategories();
    if (!cats || cats.length === 0) return false;
    // Validar que las categorías seleccionadas sean válidas
    const validCats = this.categories();
    const hasValidCategory = cats.some(c => c === 'todas' || validCats.includes(c));
    if (!hasValidCategory) return false;
    const t = Number(this.gameTimeSec);
    if (!Number.isFinite(t) || t < 3 || t > 60) return false;
    const max = this.totalQuestionCount() || 0;
    const n = Number(this.gameQuestionCount);
    if (!Number.isFinite(n) || n < 1 || (max > 0 && n > max)) return false;
    return true;
  }

  timeError(): string | null {
    const raw = this.gameTimeSec as any;
    if (raw === null || raw === undefined || raw === '') {
      return 'Ingresa un tiempo entre 3 y 60 segundos.';
    }
    const t = Number(raw);
    if (!Number.isFinite(t)) {
      return 'Ingresa un número válido para el tiempo.';
    }
    if (t < 3) {
      return 'El tiempo mínimo por pregunta es de 3 segundos.';
    }
    if (t > 60) {
      return 'El tiempo máximo por pregunta es de 60 segundos.';
    }
    return null;
  }

  constructor(
    private sock: SocketService,
    private questions: QuestionsService,
    private toast: ToastService,
  ) {
    this.sock.joinHost();
    this.timer = setInterval(() => this.now.set(Date.now()), 150);
    if (typeof location !== 'undefined') {
      this.shareUrl = `${location.origin}/play`;
    } else {
      this.shareUrl = 'http://localhost:4200/play';
    }
    this.refreshCatalog();
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  onQuestionAdded(): void {
    this.refreshCatalog();
  }

  refreshCatalog(): void {
    this.questions.getCatalog()
      .then((catalog) => {
        this.totalQuestionCount.set(catalog.totalCount);
        this.categories.set(catalog.categories || []);
        this.categoryCounts.set(catalog.counts || {});
        this.categoryIcons.set(catalog.categoryIcons || {});
        this.gameQuestionCount = Math.max(1, Math.min(this.gameQuestionCount, catalog.totalCount || 10));
        const sel = this.selectedCategories();
        const hasTodas = sel.includes('todas');
        const valid = sel.filter((c) => c === 'todas' || catalog.categories.includes(c));
        if (valid.length !== sel.length || (hasTodas && sel.length > 1)) this.selectedCategories.set(hasTodas ? ['todas'] : valid);
      })
      .catch(() => {
        this.totalQuestionCount.set(0);
        this.categoryCounts.set({});
      });
  }

  onCategoriesChange(value: string[]): void {
    this.selectedCategories.set(value);
  }

  addCategory(): void {
    const name = this.newCategoryName.trim().toLowerCase();
    if (!name) return;
    this.addingCategory.set(true);
    const icon = this.newCategoryIcon.trim() || undefined;
    this.questions.addCategory(name, icon)
      .then((result) => {
        this.newCategoryName = '';
        this.newCategoryIcon = '';
        this.refreshCatalog();
        this.toast.success(result.created ? 'Categoria creada.' : 'La categoria ya existia.');
      })
      .catch((err: Error) => {
        this.toast.error(err.message || 'No se pudo crear categoria');
      })
      .finally(() => this.addingCategory.set(false));
  }

  copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  openShare() {
    if (!this.shareUrl) return;
    if (typeof window !== 'undefined') {
      window.open(this.shareUrl, '_blank', 'noopener');
    }
  }

  start() {
    const timeMs = Math.max(5, Math.min(60, Number(this.gameTimeSec) || 15)) * 1000;
    const sel = this.selectedCategories();
    const categories = sel.length === 0 || sel.includes('todas') ? ['todas'] : sel;
    const maxFromBank = this.totalQuestionCount();
    const desiredCount = Math.max(1, Number(this.gameQuestionCount) || 10);
    const safeCount = maxFromBank > 0 ? Math.min(desiredCount, maxFromBank) : desiredCount;
    this.sock.hostStart({
      questionTimeMs: timeMs,
      questionCount: safeCount,
      categories,
    });
  }

  next() { this.sock.hostNext(); }
  reveal() { this.sock.hostReveal(); }
  pause() { this.sock.hostPause(); }
  resume() { this.sock.hostResume(); }
  stopGame() { this.sock.hostStop(); }

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
    return this.categoryIcons()[key] || defaults[key] || '📁';
  }

  categoryPct(cat: string): string {
    const total = this.totalQuestionCount();
    if (!total) return '0';
    const n = this.categoryCounts()[cat] || 0;
    return ((n / total) * 100).toFixed(1) + '%';
  }
}
