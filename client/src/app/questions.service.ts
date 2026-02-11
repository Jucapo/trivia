import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

export interface QuestionItem {
  q: string;
  options: string[];
  answer: number;
}

function apiBase(): string {
  if (environment.serverUrl) return environment.serverUrl;
  if (typeof location !== 'undefined') return `http://${location.hostname}:3000`;
  return 'http://localhost:3000';
}

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  async list(): Promise<QuestionItem[]> {
    const res = await fetch(`${apiBase()}/api/questions`);
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
}
