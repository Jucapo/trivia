import { Component, OnDestroy, computed, signal } from '@angular/core';
import { DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../socket.service';
import { QuestionsService } from '../../questions.service';
import { QuestionBankFormComponent } from '../../components/question-bank-form/question-bank-form.component';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: true,
  selector: 'app-host-page',
  imports: [DecimalPipe, NgFor, NgIf, NgClass, FormsModule, QuestionBankFormComponent],
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
          <select class="input" [ngModel]="categoryDropdownValue" (ngModelChange)="onCategorySelected($event)">
            <option value="">Elegir categoria...</option>
            <option *ngFor="let c of availableCategoriesForDropdown()" [value]="c">{{ c }}</option>
          </select>
          <div class="chip-row chip-row--select" *ngIf="selectedCategories().length > 0">
            <span *ngFor="let c of selectedCategories()" class="chip chip--select">
              <span class="chip-dot"></span>{{ c }}
              <button type="button" class="chip-x" (click)="removeCategoryChip(c)" aria-label="Quitar">×</button>
            </span>
          </div>
        </div>
      </div>
      <p class="muted no-margin">Banco disponible: {{ totalQuestionCount() || '...' }} preguntas.</p>
    </div>
  </details>

  <details class="card host-panel host-section host-accordion" open>
    <summary>Jugadores ingresados</summary>
    <ul class="list" *ngIf="players().length > 0">
      <li *ngFor="let p of players()" class="list-item">
        <span>{{p.name}}</span><span class="badge">Pts: {{p.score}}</span>
      </li>
    </ul>
    <p *ngIf="players().length === 0" class="muted">Ningun jugador ha ingresado. Comparte el enlace para que se unan.</p>
    <div class="host-status-row">
      <h3>Estado</h3>
      <p class="badge">{{ lobbyStarted() ? 'En curso' : 'En lobby' }}</p>
      <div *ngIf="counts() as c" class="grid answers-grid">
        <div class="card soft">A: {{c[0]}}</div>
        <div class="card soft">B: {{c[1]}}</div>
        <div class="card soft">C: {{c[2]}}</div>
        <div class="card soft">D: {{c[3]}}</div>
      </div>
    </div>
    <div class="host-actions" *ngIf="lobbyStarted()">
      <button class="btn secondary" (click)="next()">Siguiente</button>
      <button class="btn secondary" (click)="reveal()">Revelar</button>
    </div>
  </details>

  <div class="host-float-start">
    <button class="btn btn-float" (click)="start()" [disabled]="!canStart()">Iniciar</button>
  </div>

  <div class="card host-panel" *ngIf="current() as q">
    <div class="header-row">
      <h3>Pregunta {{q.index+1}} / {{q.total}}</h3>
      <div class="badge" *ngIf="timeLeft(q) >= 0">Tiempo: {{ timeLeft(q) / 1000 | number:'1.0-0' }}s</div>
    </div>

    <div class="progress"><div class="progress-bar" [style.width.%]="progressPct(q)"></div></div>

    <div class="question-chips" *ngIf="q.category || q.difficulty">
      <span *ngIf="q.category" class="chip chip--category" [ngClass]="'chip--cat-' + (q.category || 'cultura')">
        <span class="chip-dot"></span>{{ q.category }}
      </span>
      <span *ngIf="q.difficulty" class="chip chip--difficulty" [ngClass]="'chip--diff-' + (q.difficulty || 'media')">
        <span class="chip-dot"></span>{{ q.difficulty }}
      </span>
    </div>
    <p class="question">{{q.q}}</p>
    <ul>
      <li *ngFor="let opt of q.options; let i = index">{{ 'ABCD'[i] }}) {{opt}}</li>
    </ul>
    <p *ngIf="q.reveal" class="badge ok">Correcta: {{ 'ABCD'[q.correct ?? 0] }}</p>
  </div>

  <div class="card host-panel" *ngIf="leaderboard().length > 0">
    <h3>Resultados</h3>
    <ul class="list">
      <li *ngFor="let p of leaderboard(); let i = index" class="list-item">
        <span>{{i+1}}. {{p.name}}</span><span class="badge">Pts: {{p.score}}</span>
      </li>
    </ul>
  </div>

  <app-question-bank-form [categories]="categories()" (questionAdded)="onQuestionAdded()"></app-question-bank-form>

  <details class="card host-panel add-question-panel category-admin-panel host-accordion">
    <summary>Gestionar categorias</summary>
    <p class="muted">Agrega nuevas categorias para usarlas al crear preguntas y filtrar partidas.</p>
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
            <td>{{ c }}</td>
            <td>{{ categoryCounts()[c] || 0 }}</td>
            <td>{{ categoryPct(c) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </details>
  `,
  styles: [`
    :host { display: block; padding-bottom: 80px; }
  `]
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
  categories = signal<string[]>(['cultura', 'historia', 'geografia', 'entretenimiento', 'videojuegos', 'musica']);
  categoryCounts = signal<Record<string, number>>({});
  categoryDropdownValue = '';
  selectedCategories = signal<string[]>(['todas']);
  newCategoryName = '';
  addingCategory = signal(false);

  availableCategoriesForDropdown = computed(() => {
    const sel = this.selectedCategories();
    return ['todas', ...this.categories()].filter((c) => !sel.includes(c));
  });

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

  onCategorySelected(value: string): void {
    this.categoryDropdownValue = '';
    if (!value) return;
    const v = value.trim().toLowerCase();
    if (v === 'todas') {
      this.selectedCategories.set(['todas']);
      return;
    }
    const list = this.selectedCategories().filter((c) => c !== 'todas');
    if (list.includes(v)) return;
    this.selectedCategories.set([...list, v]);
  }

  removeCategoryChip(cat: string): void {
    this.selectedCategories.set(this.selectedCategories().filter((c) => c !== cat));
  }

  addCategory(): void {
    const name = this.newCategoryName.trim().toLowerCase();
    if (!name) return;
    this.addingCategory.set(true);
    this.questions.addCategory(name)
      .then((result) => {
        this.newCategoryName = '';
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

  categoryPct(cat: string): string {
    const total = this.totalQuestionCount();
    if (!total) return '0';
    const n = this.categoryCounts()[cat] || 0;
    return ((n / total) * 100).toFixed(1) + '%';
  }
}
