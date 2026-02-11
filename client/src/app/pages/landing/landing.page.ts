import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <div class="card landing">
      <h1>ðŸŽ¯ Trivia</h1>
      <p>Juega con amigos en vivo. Crea la partida como host o Ãºnete con el enlace que te pasen.</p>
      <div class="landing-links">
        <a routerLink="/host" class="btn">ðŸŽ›ï¸ Soy host</a>
        <a routerLink="/play" class="btn secondary">ðŸŽ® Quiero jugar</a>
      </div>
    </div>
  `,
})
export class LandingPage {}
