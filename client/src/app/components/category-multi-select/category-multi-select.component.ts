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
  ViewChild,
} from '@angular/core';
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-category-multi-select',
  imports: [NgFor, NgIf, TitleCasePipe],
  template: `
    <div class="multiselect" #multiselectRef [class.open]="open()">
      <button type="button" class="multiselect-trigger" #triggerRef (click)="toggle()">
        <span class="multiselect-chips" *ngIf="displayChips().length > 0">
          <span *ngFor="let c of displayChips()" class="chip chip--multiselect">
            <span class="chip-icon">{{ iconFor(c) }}</span>{{ c | titlecase }}
            <button type="button" class="chip-x" (click)="remove($event, c)" aria-label="Quitar">×</button>
          </span>
        </span>
        <span class="multiselect-placeholder" *ngIf="displayChips().length === 0">Elegir categorias...</span>
        <span class="multiselect-chevron">▾</span>
      </button>
      <div
        class="multiselect-dropdown"
        *ngIf="open()"
        [style.top.px]="dropdownPos().top"
        [style.left.px]="dropdownPos().left"
        [style.width.px]="dropdownPos().width">
        <div
          class="multiselect-option multiselect-option--all"
          (click)="toggleAll()">
          <input type="checkbox" [checked]="allSelected()" [indeterminate]="someSelected() && !allSelected()">
          <span class="chip-icon">📋</span>
          <span><strong>Todas</strong></span>
        </div>
        <div class="multiselect-divider"></div>
        <div class="multiselect-option" *ngFor="let opt of options" (click)="toggleOption(opt)">
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
      color: var(--text);
    }
    @media (prefers-color-scheme: dark) {
      .multiselect-trigger {
        background: var(--card);
        border-color: #475569;
      }
    }
    .multiselect-trigger:hover {
      border-color: #cbd5e1;
    }
    @media (prefers-color-scheme: dark) {
      .multiselect-trigger:hover {
        border-color: #64748b;
      }
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
    @media (prefers-color-scheme: dark) {
      .multiselect-placeholder {
        color: #94a3b8;
      }
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
    @media (prefers-color-scheme: dark) {
      .multiselect-chevron {
        color: #94a3b8;
      }
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
      position: fixed;
      max-height: 260px;
      overflow-y: auto;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
      z-index: 9999;
      padding: 8px;
    }
    @media (prefers-color-scheme: dark) {
      .multiselect-dropdown {
        background: var(--card);
        border-color: #475569;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      }
    }
    .multiselect-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      color: var(--text);
    }
    .multiselect-option:hover {
      background: #f1f5f9;
    }
    @media (prefers-color-scheme: dark) {
      .multiselect-option:hover {
        background: rgba(59, 130, 246, 0.1);
      }
    }
    .multiselect-option input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .multiselect-option--all {
      background: rgba(102, 126, 234, 0.06);
      font-weight: 600;
    }
    .multiselect-option--all:hover {
      background: rgba(102, 126, 234, 0.12);
    }
    @media (prefers-color-scheme: dark) {
      .multiselect-option--all {
        background: rgba(102, 126, 234, 0.15);
      }
      .multiselect-option--all:hover {
        background: rgba(102, 126, 234, 0.25);
      }
    }
    .multiselect-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 6px 4px;
    }
    @media (prefers-color-scheme: dark) {
      .multiselect-divider {
        background: #475569;
      }
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
  // Internal: list of selected INDIVIDUAL category names (never contains 'todas')
  internalSelected = signal<string[]>([]);
  dropdownPos = signal<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  @ViewChild('triggerRef') triggerRef?: ElementRef<HTMLButtonElement>;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.syncFromInputs();
  }

  ngOnChanges(ch: SimpleChanges) {
    this.syncFromInputs();
  }

  private syncFromInputs() {
    const incoming = this.selected || [];
    const opts = this.options || [];
    // If parent passed ['todas'] treat it as "all selected"
    if (incoming.includes('todas')) {
      this.internalSelected.set([...opts]);
    } else {
      this.internalSelected.set(incoming.filter((c) => opts.includes(c)));
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (!this.open()) return;
    const target = ev.target as Node;
    if (this.el.nativeElement.contains(target)) return;
    // Also allow clicks on our floating dropdown (rendered outside native component)
    const dropdown = document.querySelector('.multiselect-dropdown');
    if (dropdown && dropdown.contains(target)) return;
    this.open.set(false);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange() {
    if (this.open()) this.updateDropdownPos();
  }

  toggle() {
    const willOpen = !this.open();
    if (willOpen) this.updateDropdownPos();
    this.open.set(willOpen);
  }

  private updateDropdownPos() {
    const el = this.triggerRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxDropdownHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < maxDropdownHeight + 20 && rect.top > maxDropdownHeight;
    const top = showAbove ? rect.top - maxDropdownHeight - 8 : rect.bottom + 6;
    this.dropdownPos.set({
      top,
      left: rect.left,
      width: rect.width,
    });
  }

  remove(ev: Event, cat: string) {
    ev.stopPropagation();
    if (cat === 'todas') {
      this.internalSelected.set([]);
      this.emit();
      return;
    }
    const next = this.internalSelected().filter((c) => c !== cat);
    this.internalSelected.set(next);
    this.emit();
  }

  isSelected(opt: string): boolean {
    return this.internalSelected().includes(opt);
  }

  allSelected(): boolean {
    const opts = this.options || [];
    const sel = this.internalSelected();
    return opts.length > 0 && sel.length === opts.length;
  }

  someSelected(): boolean {
    return this.internalSelected().length > 0;
  }

  /** Chips shown in the trigger: a single "Todas" chip when all selected, else individual chips */
  displayChips(): string[] {
    if (this.allSelected()) return ['todas'];
    return this.internalSelected();
  }

  iconFor(cat: string): string {
    const key = (cat || '').toLowerCase();
    return this.categoryIcons?.[key] || CategoryMultiSelectComponent.DEFAULT_ICONS[key] || '📁';
  }

  toggleAll() {
    if (this.allSelected()) {
      this.internalSelected.set([]);
    } else {
      this.internalSelected.set([...(this.options || [])]);
    }
    this.emit();
  }

  toggleOption(opt: string) {
    const list = this.internalSelected();
    let next: string[];
    if (list.includes(opt)) {
      next = list.filter((c) => c !== opt);
    } else {
      next = [...list, opt];
    }
    this.internalSelected.set(next);
    this.emit();
  }

  private emit() {
    // Emit 'todas' for backward compat when all selected, else individual list
    const out = this.allSelected() ? ['todas'] : [...this.internalSelected()];
    this.selectedChange.emit(out);
  }
}
