import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface QuestionItem {
  q: string;
  options: string[];
  answer: number;
  category: string;
  difficulty: 'baja' | 'media' | 'alta';
  source?: 'static' | 'user';
}

export interface CatalogInfo {
  categories: string[];
  counts: Record<string, number>;
  categoryIcons?: Record<string, string>;
  staticCount: number;
  userCount: number;
  totalCount: number;
}

function apiBase(): string {
  if (environment.serverUrl) return environment.serverUrl;
  if (typeof location !== 'undefined') return `http://${location.hostname}:3000`;
  return 'http://localhost:3000';
}

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  async list(source: 'all' | 'static' | 'user' = 'all'): Promise<QuestionItem[]> {
    const res = await fetch(`${apiBase()}/api/questions?source=${source}`);
    if (!res.ok) throw new Error('No se pudieron cargar las preguntas');
    return res.json();
  }

  async add(question: QuestionItem): Promise<QuestionItem> {
    const res = await fetch(`${apiBase()}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al guardar la pregunta');
    }
    return res.json();
  }

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${apiBase()}/api/categories`);
    if (!res.ok) throw new Error('No se pudieron cargar las categorias');
    return res.json();
  }

  async addCategory(name: string, icon?: string): Promise<{ name: string; created: boolean }> {
    const res = await fetch(`${apiBase()}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(icon != null ? { name, icon } : { name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo crear categoria');
    }
    return res.json();
  }

  async getCatalog(): Promise<CatalogInfo> {
    const res = await fetch(`${apiBase()}/api/catalog`);
    if (!res.ok) throw new Error('No se pudo cargar el catalogo');
    return res.json();
  }
}
