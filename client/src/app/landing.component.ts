import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <div class="card landing">
      <h1>🎯 Trivia</h1>
      <p>Juega con amigos en vivo. Crea la partida como host o únete con el enlace que te pasen.</p>
      <div class="landing-links">
        <a routerLink="/host" class="btn">🎛️ Soy host</a>
        <a routerLink="/play" class="btn secondary">🎮 Quiero jugar</a>
      </div>
    </div>
  `,
})
export class LandingComponent {}
