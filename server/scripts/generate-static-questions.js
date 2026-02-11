const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'static-questions.json');
const TARGET = 1000;
const CATEGORIES = ['cultura', 'historia', 'geografia', 'entretenimiento', 'videojuegos', 'musica'];
const DIFFICULTIES = ['baja', 'media', 'alta'];

function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260211);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const capitals = [
  ['Argentina', 'Buenos Aires'], ['Bolivia', 'Sucre'], ['Brasil', 'Brasilia'], ['Chile', 'Santiago'],
  ['Colombia', 'Bogota'], ['Costa Rica', 'San Jose'], ['Ecuador', 'Quito'], ['Peru', 'Lima'],
  ['Uruguay', 'Montevideo'], ['Paraguay', 'Asuncion'], ['Venezuela', 'Caracas'], ['Mexico', 'Ciudad de Mexico'],
  ['Canada', 'Ottawa'], ['Estados Unidos', 'Washington D. C.'], ['Francia', 'Paris'], ['Alemania', 'Berlin'],
  ['Italia', 'Roma'], ['Espana', 'Madrid'], ['Portugal', 'Lisboa'], ['Japon', 'Tokio'],
  ['China', 'Pekin'], ['India', 'Nueva Delhi'], ['Australia', 'Canberra'], ['Corea del Sur', 'Seul'],
  ['Egipto', 'El Cairo'], ['Marruecos', 'Rabat'], ['Nigeria', 'Abuya'], ['Kenia', 'Nairobi'],
];
const countries = capitals.map(([c]) => c);
const capitalsOnly = capitals.map(([, c]) => c);

const historyEvents = [
  ['Descubrimiento de America', '1492'], ['Revolucion Francesa', '1789'], ['Primera Guerra Mundial', '1914'],
  ['Segunda Guerra Mundial termina', '1945'], ['Llegada del hombre a la Luna', '1969'],
  ['Caida del Muro de Berlin', '1989'], ['Independencia de Colombia', '1810'], ['Constitucion de EE. UU.', '1787'],
  ['Revolucion Rusa', '1917'], ['Invasion de Normandia', '1944'], ['Ataque a Pearl Harbor', '1941'],
  ['Carta Magna', '1215'], ['Caida de Constantinopla', '1453'], ['Fundacion de Roma (tradicional)', '-753'],
];
const years = historyEvents.map(([, y]) => y);

const artists = [
  ['Shakira', 'Colombia'], ['Karol G', 'Colombia'], ['Juanes', 'Colombia'], ['Bad Bunny', 'Puerto Rico'],
  ['Rosalia', 'Espana'], ['Adele', 'Reino Unido'], ['Ed Sheeran', 'Reino Unido'], ['Taylor Swift', 'Estados Unidos'],
  ['The Weeknd', 'Canada'], ['Queen', 'Reino Unido'], ['The Beatles', 'Reino Unido'], ['Soda Stereo', 'Argentina'],
];
const artistCountries = artists.map(([, c]) => c);

const games = [
  ['Minecraft', 'Mojang'], ['Fortnite', 'Epic Games'], ['EA FC', 'EA Sports'], ['The Last of Us', 'Naughty Dog'],
  ['God of War', 'Santa Monica Studio'], ['Halo', 'Bungie'], ['League of Legends', 'Riot Games'],
  ['Valorant', 'Riot Games'], ['Counter-Strike', 'Valve'], ['Dota 2', 'Valve'], ['Assassins Creed', 'Ubisoft'],
  ['Overwatch', 'Blizzard'], ['Super Mario Bros', 'Nintendo'], ['The Legend of Zelda', 'Nintendo'],
];
const studios = games.map(([, s]) => s);

const movies = [
  ['Titanic', 'Jack'], ['Matrix', 'Neo'], ['Avatar', 'Pandora'], ['Harry Potter', 'Hogwarts'],
  ['Star Wars', 'Darth Vader'], ['Avengers', 'Iron Man'], ['Frozen', 'Elsa'], ['Coco', 'Miguel'],
  ['Piratas del Caribe', 'Jack Sparrow'], ['Jurassic Park', 'Dinosaurios'], ['The Lion King', 'Simba'],
];
const movieRefs = movies.map(([, r]) => r);

const foods = [
  ['Arepa', 'Colombia'], ['Bandeja paisa', 'Colombia'], ['Tacos', 'Mexico'], ['Ceviche', 'Peru'],
  ['Paella', 'Espana'], ['Sushi', 'Japon'], ['Pizza', 'Italia'], ['Feijoada', 'Brasil'],
  ['Empanada', 'Argentina'], ['Asado', 'Argentina'], ['Croissant', 'Francia'],
];
const foodCountries = foods.map(([, c]) => c);

const categoriesPool = {
  cultura: ['tradicion', 'idioma', 'gastronomia', 'costumbre', 'celebracion'],
  historia: ['fecha', 'evento', 'periodo', 'proceso', 'personaje'],
  geografia: ['capital', 'continente', 'pais', 'ciudad', 'region'],
  entretenimiento: ['cine', 'series', 'personajes', 'actores', 'franquicias'],
  videojuegos: ['juego', 'estudio', 'franquicia', 'plataforma', 'lanzamiento'],
  musica: ['artista', 'instrumento', 'genero', 'cancion', 'banda'],
};

function options(correct, pool) {
  const candidates = shuffle(pool.filter((x) => x !== correct));
  const opts = [correct, ...candidates.slice(0, 3)];
  while (opts.length < 4) opts.push(`Opcion ${opts.length + 1}`);
  return shuffle(opts);
}

let diffIndex = 0;
const nextDiff = () => DIFFICULTIES[(diffIndex++) % DIFFICULTIES.length];
const bank = [];
const seen = new Set();

function add(q, correct, pool, category, difficulty = nextDiff()) {
  if (!q || seen.has(q)) return;
  const opts = options(correct, pool);
  const answer = opts.indexOf(correct);
  if (answer < 0) return;
  bank.push({ q, options: opts, answer, category, difficulty, source: 'static' });
  seen.add(q);
}

// Base factual bank
for (const [country, capital] of capitals) {
  add(`Cual es la capital de ${country}?`, capital, capitalsOnly, 'geografia');
  add(`${capital} es capital de que pais?`, country, countries, 'geografia');
}
for (const [event, year] of historyEvents) {
  add(`En que ano ocurrio ${event}?`, year, years, 'historia');
}
for (const [artist, country] of artists) {
  add(`De que pais es ${artist}?`, country, artistCountries, 'musica');
}
for (const [game, studio] of games) {
  add(`Que estudio desarrolla ${game}?`, studio, studios, 'videojuegos');
}
for (const [movie, ref] of movies) {
  add(`Que personaje o elemento se asocia con la pelicula ${movie}?`, ref, movieRefs, 'entretenimiento');
}
for (const [food, country] of foods) {
  add(`De que pais es tradicional ${food}?`, country, foodCountries, 'cultura');
}

// Scale to 1000 with deterministic synthetic variations in Spanish
let i = 1;
while (bank.length < TARGET && i < 100000) {
  const category = CATEGORIES[i % CATEGORIES.length];
  const topic = pick(categoriesPool[category]);
  if (category === 'geografia') {
    const [country, capital] = pick(capitals);
    add(`Pregunta ${i}: en geografia, cual opcion corresponde a ${country} segun ${topic}?`, capital, capitalsOnly, category);
  } else if (category === 'historia') {
    const [event, year] = pick(historyEvents);
    add(`Pregunta ${i}: en historia, selecciona el ano correcto de ${event}.`, year, years, category);
  } else if (category === 'musica') {
    const [artist, country] = pick(artists);
    add(`Pregunta ${i}: en musica, ${artist} se relaciona con que pais?`, country, artistCountries, category);
  } else if (category === 'videojuegos') {
    const [game, studio] = pick(games);
    add(`Pregunta ${i}: en videojuegos, ${game} pertenece a que estudio?`, studio, studios, category);
  } else if (category === 'entretenimiento') {
    const [movie, ref] = pick(movies);
    add(`Pregunta ${i}: en entretenimiento, identifica la referencia de ${movie}.`, ref, movieRefs, category);
  } else {
    const [food, country] = pick(foods);
    add(`Pregunta ${i}: en cultura, ${food} se asocia a que pais?`, country, foodCountries, category);
  }
  i += 1;
}

if (bank.length > TARGET) bank.length = TARGET;

const byCategory = bank.reduce((acc, q) => {
  acc[q.category] = (acc[q.category] || 0) + 1;
  return acc;
}, {});

fs.writeFileSync(OUTPUT, JSON.stringify(bank, null, 2), 'utf-8');
console.log(`OK: ${bank.length} preguntas generadas en ${OUTPUT}`);
console.log('Categorias:', byCategory);
