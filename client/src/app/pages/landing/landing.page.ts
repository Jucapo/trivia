import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-landing-page',
  imports: [RouterLink],
  styleUrls: ['./landing.page.scss'],
  template: `
    <div class="landing-container landing-page-wrapper">
      <div class="landing-card">
        <div class="landing-content">
          <h1 class="landing-title">TRIVIA</h1>
          <p class="landing-description">Juega con amigos en vivo. Únete como jugador, crea la partida como host o gestiona el banco de preguntas.</p>
          <div class="landing-links">
            <a routerLink="/play" class="btn landing-btn-primary">
              <span class="landing-btn-icon">🎮</span>
              <span class="landing-btn-text">Quiero Jugar</span>
            </a>
            <a routerLink="/host" class="btn secondary landing-btn-secondary">
              <span class="landing-btn-icon">⚙️</span>
              <span class="landing-btn-text">Soy Host</span>
            </a>
            <a routerLink="/admin" class="btn secondary landing-btn-secondary">
              <span class="landing-btn-icon">📚</span>
              <span class="landing-btn-text">Gestionar Preguntas Y Categorias</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LandingPage {}
