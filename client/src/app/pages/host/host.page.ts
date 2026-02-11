import { Component, OnDestroy, signal } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../socket.service';
import { QuestionsService } from '../../questions.service';
import { QuestionBankFormComponent } from '../../components/question-bank-form/question-bank-form.component';
import { CategoryMultiSelectComponent } from '../../components/category-multi-select/category-multi-select.component';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  selector: 'app-host-page',
  imports: [DecimalPipe, NgFor, NgIf, NgClass, TitleCasePipe, FormsModule, QuestionBankFormComponent, CategoryMultiSelectComponent],
  template: `
  <details class="card host-panel host-section host-accordion" [attr.open]="lobbyStarted() ? null : ''">
    <summary>Configuracion</summary>
    <div class="share-row">
      <span class="badge">Comparte:</span>
      <code class="share-url">{{ shareUrl }}</code>
      <button type="button" class="btn btn-copy" (click)="copyLink()" [class.copied]="copied()">{{ copied() ? 'OK Copiado' : 'Copiar' }}</button>
    </div>
    <div class="game-settings">
      <h3>Configuracion de partida</h3>
      <div class="grid grid-2">
        <div>
          <label>Tiempo por pregunta (segundos) <span class="required">*</span></label>
          <input type="number" class="input" [(ngModel)]="gameTimeSec" min="5" max="60" placeholder="5-60" required>
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
  </details>

  <details class="card host-panel host-section host-accordion" open>
    <summary>Jugadores ingresados</summary>
    <ul class="list" *ngIf="players().length > 0">
      <li *ngFor="let p of players()" class="list-item">
        <span>{{p.name}}</span>
        <span class="list-item-badges">
          <span class="badge">Pts: {{p.score}}</span>
          <span class="chip chip--correct" *ngIf="(p.correctCount ?? 0) > 0"><span class="chip-dot"></span>{{ p.correctCount }} correctas</span>
        </span>
      </li>
    </ul>
    <p *ngIf="players().length === 0" class="muted">Ningun jugador ha ingresado. Comparte el enlace para que se unan.</p>
    <div class="host-status-row">
      <h3>Estado</h3>
      <p class="badge">{{ lobbyStarted() && paused() ? 'Pausado' : lobbyStarted() ? 'En curso' : 'En lobby' }}</p>
      <div *ngIf="counts() as c" class="grid answers-grid">
        <div class="card soft">A: {{c[0]}}</div>
        <div class="card soft">B: {{c[1]}}</div>
        <div class="card soft">C: {{c[2]}}</div>
        <div class="card soft">D: {{c[3]}}</div>
      </div>
    </div>
  </details>

  <div class="host-float-start" *ngIf="!lobbyStarted()">
    <button class="btn btn-float" (click)="start()" [disabled]="!canStart()"><span class="icon-play">&#9654;</span> Iniciar</button>
  </div>
  <div class="host-float-start host-float-actions" *ngIf="lobbyStarted() && !paused()">
    <button class="btn btn-float btn-float-pause" (click)="pause()"><span class="icon-pause">&#9208;</span> Pausar</button>
  </div>
  <div class="host-float-start host-float-actions host-float-two" *ngIf="lobbyStarted() && paused()">
    <button class="btn btn-float btn-float-resume" (click)="resume()"><span class="icon-play">&#9654;</span> Reanudar</button>
    <button class="btn btn-float btn-float-danger" (click)="stopGame()"><span class="icon-restart">&#8635;</span> Reiniciar</button>
  </div>

  <details class="card host-panel host-accordion question-card-accordion" *ngIf="current() as q" open>
    <summary>Pregunta actual ({{q.index+1}} de {{q.total}})</summary>
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
  </details>

  <div class="card host-panel" *ngIf="leaderboard().length > 0">
    <h3>Resultados</h3>
    <ul class="list">
      <li *ngFor="let p of leaderboard(); let i = index" class="list-item">
        <span>{{i+1}}. {{p.name}}</span>
        <span class="list-item-badges">
          <span class="badge">Pts: {{p.score}}</span>
          <span class="chip chip--correct"><span class="chip-dot"></span>{{ p.correctCount ?? 0 }} correctas</span>
        </span>
      </li>
    </ul>
  </div>

  <app-question-bank-form [categories]="categories()" (questionAdded)="onQuestionAdded()"></app-question-bank-form>

  <details class="card host-panel add-question-panel category-admin-panel host-accordion">
    <summary>Gestionar categorias</summary>
    <p class="muted">Agrega nuevas categorias para usarlas al crear preguntas y filtrar partidas.</p>
    <div class="category-icon-picker">
      <span class="category-icon-picker-label">Icono (opcional):</span>
      <span class="category-icon-list">
        <button type="button" *ngFor="let ic of availableCategoryIcons" class="icon-pick-btn" [class.selected]="newCategoryIcon === ic" (click)="newCategoryIcon = ic" [title]="ic">{{ ic }}</button>
      </span>
    </div>
    <div class="category-add-row">
      <input class="input" [(ngModel)]="newCategoryName" placeholder="Nueva categoria (ej: deportes)">
      <button class="btn secondary" type="button" (click)="addCategory()" [disabled]="addingCategory()">Agregar categoria</button>
    </div>
    <div class="category-table-wrap" *ngIf="categories().length > 0">
      <table class="category-table">
        <thead>
          <tr><th>Categoria</th><th>Preguntas</th><th>% del banco</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of categories()">
            <td><span class="chip-icon">{{ categoryIcon(c) }}</span> {{ c | titlecase }}</td>
            <td>{{ categoryCounts()[c] || 0 }}</td>
            <td>{{ categoryPct(c) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </details>
  `,
  styles: [`
    :host { display: block; padding-bottom: 100px; }

    .host-panel { padding: 28px; }
    .host-col { padding: 6px 0; }
    .host-section { margin-bottom: 20px; }
    .host-status-row { 
      margin-top: 20px; 
      padding-top: 20px; 
      border-top: 2px solid #e2e8f0; 
    }
    .host-status-row h3 { margin-bottom: 12px; }
    .host-actions { 
      margin-top: 20px; 
      display: flex; 
      gap: 12px; 
      flex-wrap: wrap; 
    }

    .host-float-start {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
    }
    .host-float-actions.host-float-two {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn-float {
      padding: 16px 32px !important;
      font-size: 16px !important;
      box-shadow: 0 8px 24px rgba(30, 64, 175, 0.4) !important;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-float-pause {
      background: linear-gradient(180deg, #eab308, #ca8a04) !important;
      color: #1c1917 !important;
      box-shadow: 0 8px 24px rgba(202, 138, 4, 0.4) !important;
    }
    .btn-float-resume {
      background: linear-gradient(180deg, #22c55e, #16a34a) !important;
      box-shadow: 0 8px 24px rgba(22, 163, 94, 0.35) !important;
    }
    .btn-float-danger {
      background: linear-gradient(180deg, #dc2626, #b91c1c) !important;
      color: #fff !important;
      box-shadow: 0 8px 24px rgba(185, 28, 28, 0.4) !important;
    }
    .icon-play, .icon-pause, .icon-restart {
      font-size: 1.1em;
      line-height: 1;
    }

    .host-accordion summary {
      font-size: 1.15rem;
      font-weight: 600;
      cursor: pointer;
      list-style: none;
      margin-bottom: 16px;
      padding: 8px 0;
    }
    .host-accordion summary::-webkit-details-marker { display: none; }
    .host-accordion summary::after {
      content: '▾';
      float: right;
      color: var(--muted);
      font-size: 1.2em;
    }
    .host-accordion[open] summary::after { content: '▴'; }

    .question-card-accordion summary { font-weight: 600; cursor: pointer; list-style: none; }
    .question-card-accordion summary::-webkit-details-marker { display: none; }
    .question-card-accordion summary::after { content: ' ▾'; color: var(--muted); float: right; }
    .question-card-accordion[open] summary::after { content: ' ▴'; }

    .game-settings {
      margin-bottom: 16px;
      padding: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(248, 251, 255, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
    }

    .category-select-col label { display: block; margin-bottom: 8px; }

    .category-add-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      margin-top: 12px;
    }

    .add-question-panel { margin-top: 24px; }
    .add-question-form label { 
      display: block; 
      margin-top: 10px; 
      font-weight: 600; 
      color: var(--text); 
      font-size: 14px; 
    }
    .add-question-form label:first-of-type { margin-top: 0; }
    .form-actions { 
      margin-top: 20px; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      flex-wrap: wrap; 
    }

    .category-admin-panel { margin-top: 16px; }
    .category-table-wrap {
      margin-top: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .category-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
    }
    .category-table th,
    .category-table td {
      text-align: left;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .category-table th {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-size: 13px;
      color: #334155;
      font-weight: 600;
    }
    .category-table td:nth-child(2),
    .category-table th:nth-child(2) { text-align: right; width: 100px; }
    .category-table td:nth-child(3),
    .category-table th:nth-child(3) { text-align: right; width: 90px; }
    .category-table tbody tr:last-child td { border-bottom: 0; }
    .category-table tbody tr:hover {
      background: rgba(102, 126, 234, 0.03);
    }

    .category-icon-picker { margin-bottom: 16px; }
    .category-icon-picker-label { 
      display: block; 
      font-size: 14px; 
      font-weight: 600; 
      margin-bottom: 10px; 
      color: var(--text); 
    }
    .category-icon-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .icon-pick-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      font-size: 1.3rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .icon-pick-btn:hover { 
      border-color: var(--accent-light); 
      background: #f8fbff; 
      transform: scale(1.1);
    }
    .icon-pick-btn.selected { 
      border-color: var(--accent-light); 
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    @media (max-width: 820px) {
      .host-panel { padding: 20px; }
      .category-add-row { grid-template-columns: 1fr; }
      .host-float-start {
        bottom: 16px;
        right: 16px;
      }
      .host-float-actions.host-float-two {
        flex-direction: column;
      }
      .btn-float {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 560px) {
      .host-actions .btn { width: 100%; }
      .form-actions { align-items: stretch; }
      .form-actions .btn { width: 100%; }
      .category-table th,
      .category-table td { padding: 10px 12px; }
    }
  `]
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

  canStart(): boolean {
    if (this.lobbyStarted()) return false;
    if (this.players().length === 0) return false;
    if (this.selectedCategories().length === 0) return false;
    const t = Number(this.gameTimeSec);
    if (!Number.isFinite(t) || t < 5 || t > 60) return false;
    const max = this.totalQuestionCount() || 0;
    const n = Number(this.gameQuestionCount);
    if (!Number.isFinite(n) || n < 1 || (max > 0 && n > max)) return false;
    return true;
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
