import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-landing-page',
  imports: [RouterLink],
  styleUrls: ['./landing.page.scss'],
  template: `
    <div class="landing-container">
      <div class="landing-card">
        <div class="landing-content">
          <h1 class="landing-title">Trivia</h1>
          <p class="landing-description">Juega con amigos en vivo. Crea la partida como host, únete como jugador o gestiona el banco de preguntas.</p>
          <div class="landing-links">
            <a routerLink="/host" class="btn landing-btn-primary">Soy host</a>
            <a routerLink="/play" class="btn secondary landing-btn-secondary">Quiero jugar</a>
            <a routerLink="/admin" class="btn secondary landing-btn-secondary">Gestionar preguntas y categorias</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LandingPage {}
