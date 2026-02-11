import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-category-multi-select',
  imports: [NgFor, NgIf, TitleCasePipe],
  template: `
    <div class="multiselect" #multiselectRef [class.open]="open()">
      <button type="button" class="multiselect-trigger" (click)="toggle()">
        <span class="multiselect-chips" *ngIf="selectedList().length > 0">
          <span *ngFor="let c of selectedList()" class="chip chip--multiselect">
            <span class="chip-icon">{{ iconFor(c) }}</span>{{ c | titlecase }}
            <button type="button" class="chip-x" (click)="remove($event, c)" aria-label="Quitar">×</button>
          </span>
        </span>
        <span class="multiselect-placeholder" *ngIf="selectedList().length === 0">Elegir categorias...</span>
        <span class="multiselect-chevron">▾</span>
      </button>
      <div class="multiselect-dropdown" *ngIf="open()">
        <label class="multiselect-option multiselect-option--all">
          <input type="checkbox" [checked]="isAllSelected()" (change)="toggleAll()">
          <span>Seleccionar todas</span>
        </label>
        <div class="multiselect-option" *ngFor="let opt of availableOptions()" (click)="toggleOption(opt)">
          <input type="checkbox" [checked]="isSelected(opt)">
          <span class="chip-icon">{{ iconFor(opt) }}</span>
          <span>{{ opt | titlecase }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .multiselect {
      position: relative;
      width: 100%;
    }
    .multiselect-trigger {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
      min-height: 44px;
      padding: 10px 28px 10px 14px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      font-size: 15px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .multiselect-trigger:hover {
      border-color: #cbd5e1;
    }
    .multiselect.open .multiselect-trigger {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      outline: none;
    }
    .multiselect-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
    }
    .multiselect-placeholder {
      color: #94a3b8;
      flex: 1;
    }
    .multiselect-chevron {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      font-size: 12px;
      pointer-events: none;
    }
    .multiselect.open .multiselect-chevron {
      transform: translateY(-50%) rotate(180deg);
    }
    .chip--multiselect {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }
    .chip--multiselect .chip-dot { background: rgba(255,255,255,0.9); }
    .chip--multiselect .chip-x { color: #fff; }
    .multiselect-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      max-height: 220px;
      overflow-y: auto;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.12);
      z-index: 200;
      padding: 8px;
    }
    .multiselect-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .multiselect-option:hover {
      background: #f1f5f9;
    }
    .multiselect-option--all {
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 6px;
    }
    .multiselect-option input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .chip-icon {
      font-size: 1.1em;
      line-height: 1;
    }
  `]
})
export class CategoryMultiSelectComponent implements OnInit, OnChanges {
  @Input() options: string[] = [];
  @Input() selected: string[] = [];
  @Input() categoryIcons: Record<string, string> = {};
  @Output() selectedChange = new EventEmitter<string[]>();

  static DEFAULT_ICONS: Record<string, string> = {
    todas: '📋',
    cultura: '📚',
    historia: '🏛️',
    geografia: '🌍',
    entretenimiento: '🎬',
    videojuegos: '🎮',
    musica: '🎵',
  };

  open = signal(false);
  selectedList = signal<string[]>([]);
  availableOptions = signal<string[]>([]);

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.syncFromInputs();
  }

  ngOnChanges(ch: SimpleChanges) {
    this.syncFromInputs();
  }

  private syncFromInputs() {
    this.selectedList.set([...(this.selected || [])]);
    this.availableOptions.set(['todas', ...(this.options || [])]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (!this.open()) return;
    const target = ev.target as Node;
    if (this.el.nativeElement.contains(target)) return;
    this.open.set(false);
  }

  toggle() {
    this.open.update((o) => !o);
  }

  remove(ev: Event, cat: string) {
    ev.stopPropagation();
    const next = this.selectedList().filter((c) => c !== cat);
    this.selectedList.set(next);
    this.selectedChange.emit(next);
  }

  isSelected(opt: string): boolean {
    return this.selectedList().includes(opt);
  }

  isAllSelected(): boolean {
    return this.selectedList().includes('todas') || this.selectedList().length === 0;
  }

  toggleAll() {
    const next = this.isAllSelected() ? [] : ['todas'];
    this.selectedList.set(next);
    this.selectedChange.emit(next);
  }

  iconFor(cat: string): string {
    const key = (cat || '').toLowerCase();
    return this.categoryIcons?.[key] || CategoryMultiSelectComponent.DEFAULT_ICONS[key] || '📁';
  }

  toggleOption(opt: string) {
    let next: string[];
    if (opt === 'todas') {
      next = this.isSelected('todas') ? [] : ['todas'];
    } else {
      const list = this.selectedList().filter((c) => c !== 'todas');
      if (this.isSelected(opt)) {
        next = list.filter((c) => c !== opt);
      } else {
        next = [...list, opt];
      }
    }
    this.selectedList.set(next);
    this.selectedChange.emit(next);
  }
}
