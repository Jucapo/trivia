const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'static-questions.json');
const TARGET_TOTAL = 1000;
const TARGET_BY_CATEGORY = {
  cultura: 167,
  historia: 167,
  geografia: 167,
  entretenimiento: 167,
  videojuegos: 166,
  musica: 166,
};
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

let d = 0;
function nextDifficulty() {
  const val = DIFFICULTIES[d % DIFFICULTIES.length];
  d += 1;
  return val;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[?¿!¡.,:;()'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildOptions(correct, pool) {
  const candidates = shuffle(Array.from(new Set(pool.filter((x) => x !== correct))));
  const opts = [correct, ...candidates.slice(0, 3)];
  while (opts.length < 4) {
    const filler = `Opcion ${opts.length + 1}`;
    if (!opts.includes(filler)) opts.push(filler);
  }
  return shuffle(opts);
}

function createQuestion(question, correct, pool, category) {
  const options = buildOptions(correct, pool);
  const answer = options.indexOf(correct);
  if (answer < 0) return null;
  return {
    q: question,
    options,
    answer,
    category,
    difficulty: nextDifficulty(),
    source: 'static',
  };
}

function expandFacts({
  facts,
  templates,
  answerPool,
  category,
  getVars,
}) {
  const out = [];
  const seen = new Set();
  for (const fact of facts) {
    const vars = getVars(fact);
    for (const t of templates) {
      const q = t(vars);
      const key = normalize(q);
      if (seen.has(key)) continue;
      const item = createQuestion(q, vars.correct, answerPool, category);
      if (item) {
        out.push(item);
        seen.add(key);
      }
    }
  }
  return out;
}

// -------- Data banks --------
const capitals = [
  ['Argentina', 'Buenos Aires'], ['Bolivia', 'Sucre'], ['Brasil', 'Brasilia'], ['Chile', 'Santiago'],
  ['Colombia', 'Bogota'], ['Costa Rica', 'San Jose'], ['Cuba', 'La Habana'], ['Ecuador', 'Quito'],
  ['El Salvador', 'San Salvador'], ['Guatemala', 'Ciudad de Guatemala'], ['Honduras', 'Tegucigalpa'],
  ['Mexico', 'Ciudad de Mexico'], ['Nicaragua', 'Managua'], ['Panama', 'Ciudad de Panama'],
  ['Paraguay', 'Asuncion'], ['Peru', 'Lima'], ['Republica Dominicana', 'Santo Domingo'],
  ['Uruguay', 'Montevideo'], ['Venezuela', 'Caracas'], ['Canada', 'Ottawa'],
  ['Estados Unidos', 'Washington D. C.'], ['Australia', 'Canberra'], ['Japon', 'Tokio'],
  ['Corea del Sur', 'Seul'], ['China', 'Pekin'], ['India', 'Nueva Delhi'], ['Tailandia', 'Bangkok'],
  ['Indonesia', 'Yakarta'], ['Francia', 'Paris'], ['Alemania', 'Berlin'], ['Italia', 'Roma'],
  ['Espana', 'Madrid'], ['Portugal', 'Lisboa'], ['Reino Unido', 'Londres'], ['Grecia', 'Atenas'],
  ['Turquia', 'Ankara'], ['Egipto', 'El Cairo'], ['Marruecos', 'Rabat'], ['Sudafrica', 'Pretoria'],
  ['Nigeria', 'Abuya'], ['Kenia', 'Nairobi'], ['Noruega', 'Oslo'], ['Suecia', 'Estocolmo'],
  ['Dinamarca', 'Copenhague'], ['Finlandia', 'Helsinki'], ['Polonia', 'Varsovia'], ['Austria', 'Viena'],
  ['Suiza', 'Berna'], ['Belgica', 'Bruselas'], ['Paises Bajos', 'Amsterdam'],
];

const countryContinent = [
  ['Argentina', 'America'], ['Colombia', 'America'], ['Mexico', 'America'], ['Canada', 'America'],
  ['Brasil', 'America'], ['Espana', 'Europa'], ['Francia', 'Europa'], ['Italia', 'Europa'],
  ['Alemania', 'Europa'], ['Portugal', 'Europa'], ['Japon', 'Asia'], ['China', 'Asia'],
  ['India', 'Asia'], ['Indonesia', 'Asia'], ['Tailandia', 'Asia'], ['Egipto', 'Africa'],
  ['Marruecos', 'Africa'], ['Nigeria', 'Africa'], ['Kenia', 'Africa'], ['Sudafrica', 'Africa'],
  ['Australia', 'Oceania'], ['Nueva Zelanda', 'Oceania'],
];

const rivers = [
  ['Nilo', 'Africa'], ['Amazonas', 'America'], ['Misisipi', 'America'], ['Yangtse', 'Asia'],
  ['Danubio', 'Europa'], ['Volga', 'Europa'], ['Parana', 'America'], ['Orinoco', 'America'],
  ['Mekong', 'Asia'], ['Congo', 'Africa'],
];

const events = [
  ['Descubrimiento de America', '1492'], ['Revolucion Francesa', '1789'], ['Primera Guerra Mundial', '1914'],
  ['Fin de la Segunda Guerra Mundial', '1945'], ['Llegada del hombre a la Luna', '1969'],
  ['Caida del Muro de Berlin', '1989'], ['Independencia de Colombia', '1810'],
  ['Independencia de Mexico', '1810'], ['Constitucion de EE. UU.', '1787'], ['Revolucion Rusa', '1917'],
  ['Ataque a Pearl Harbor', '1941'], ['Invasion de Normandia', '1944'], ['Carta Magna', '1215'],
  ['Caida de Constantinopla', '1453'], ['Fundacion de Roma (tradicional)', '-753'],
  ['Grito de Dolores', '1810'], ['Inicio de la Guerra Fria', '1947'], ['Primer iPhone', '2007'],
  ['Caida del Imperio Romano de Occidente', '476'], ['Independencia de Estados Unidos', '1776'],
];

const historicalPeople = [
  ['Simon Bolivar', 'Libertador'], ['Jose de San Martin', 'Argentina'], ['Mahatma Gandhi', 'India'],
  ['Napoleon Bonaparte', 'Francia'], ['Winston Churchill', 'Reino Unido'], ['Abraham Lincoln', 'Estados Unidos'],
  ['Nelson Mandela', 'Sudafrica'], ['Julio Cesar', 'Roma'], ['Cleopatra', 'Egipto'],
  ['George Washington', 'Estados Unidos'], ['Leonardo da Vinci', 'Italia'], ['Albert Einstein', 'Alemania'],
  ['Martin Luther King Jr.', 'Estados Unidos'], ['Juana de Arco', 'Francia'], ['Alejandro Magno', 'Macedonia'],
];

const artists = [
  ['Shakira', 'Colombia'], ['Karol G', 'Colombia'], ['Juanes', 'Colombia'], ['Bad Bunny', 'Puerto Rico'],
  ['Rosalia', 'Espana'], ['Adele', 'Reino Unido'], ['Ed Sheeran', 'Reino Unido'], ['Taylor Swift', 'Estados Unidos'],
  ['The Weeknd', 'Canada'], ['Dua Lipa', 'Reino Unido'], ['Queen', 'Reino Unido'],
  ['The Beatles', 'Reino Unido'], ['Soda Stereo', 'Argentina'], ['Mon Laferte', 'Chile'],
  ['Morat', 'Colombia'], ['Carlos Vives', 'Colombia'], ['Rauw Alejandro', 'Puerto Rico'],
  ['Marc Anthony', 'Estados Unidos'], ['Manuel Turizo', 'Colombia'], ['Metallica', 'Estados Unidos'],
];

const instruments = [
  ['Piano', 'teclas'], ['Guitarra', 'cuerdas'], ['Violin', 'cuerdas'], ['Chelo', 'cuerdas'],
  ['Arpa', 'cuerdas'], ['Flauta', 'viento'], ['Clarinete', 'viento'], ['Saxofon', 'viento'],
  ['Trompeta', 'viento'], ['Trombon', 'viento'], ['Bateria', 'percusion'], ['Conga', 'percusion'],
  ['Teclado', 'teclas'], ['Ukulele', 'cuerdas'],
];

const movies = [
  ['Titanic', 'Jack'], ['Matrix', 'Neo'], ['Avatar', 'Pandora'], ['Toy Story', 'Woody'],
  ['The Lion King', 'Simba'], ['Harry Potter', 'Hogwarts'], ['Star Wars', 'Darth Vader'],
  ['Avengers', 'Iron Man'], ['Frozen', 'Elsa'], ['Coco', 'Miguel'], ['Jurassic Park', 'Dinosaurios'],
  ['Piratas del Caribe', 'Jack Sparrow'], ['Gladiador', 'Maximo'], ['Interstellar', 'Cooper'],
  ['The Godfather', 'Corleone'], ['Finding Nemo', 'Nemo'], ['Shrek', 'Burro'], ['Moana', 'Maui'],
];

const seriesPlatforms = [
  ['Stranger Things', 'Netflix'], ['The Last of Us', 'HBO'], ['The Boys', 'Prime Video'],
  ['The Mandalorian', 'Disney+'], ['Dark', 'Netflix'], ['Breaking Bad', 'AMC'],
  ['Game of Thrones', 'HBO'], ['The Witcher', 'Netflix'], ['Loki', 'Disney+'], ['Invincible', 'Prime Video'],
  ['Friends', 'Max'], ['The Office', 'Peacock'],
];

const games = [
  ['Minecraft', 'Mojang'], ['Fortnite', 'Epic Games'], ['EA FC', 'EA Sports'], ['The Last of Us', 'Naughty Dog'],
  ['God of War', 'Santa Monica Studio'], ['Halo', 'Bungie'], ['Gears of War', 'Epic Games'],
  ['The Witcher 3', 'CD Projekt Red'], ['League of Legends', 'Riot Games'], ['Valorant', 'Riot Games'],
  ['Counter-Strike', 'Valve'], ['Dota 2', 'Valve'], ['PUBG', 'Krafton'], ['Apex Legends', 'Respawn'],
  ['Assassins Creed', 'Ubisoft'], ['Far Cry', 'Ubisoft'], ['Overwatch', 'Blizzard'], ['Diablo', 'Blizzard'],
  ['Super Mario Bros', 'Nintendo'], ['The Legend of Zelda', 'Nintendo'], ['Pokemon', 'Game Freak'],
  ['Metroid', 'Nintendo'], ['Rocket League', 'Psyonix'], ['Red Dead Redemption 2', 'Rockstar Games'],
];

const gameCharacters = [
  ['Mario', 'Super Mario Bros'], ['Link', 'The Legend of Zelda'], ['Master Chief', 'Halo'],
  ['Kratos', 'God of War'], ['Geralt', 'The Witcher 3'], ['Ellie', 'The Last of Us'],
  ['Pikachu', 'Pokemon'], ['Sonic', 'Sonic the Hedgehog'], ['Lara Croft', 'Tomb Raider'],
  ['CJ', 'GTA San Andreas'], ['Aloy', 'Horizon Zero Dawn'], ['Arthur Morgan', 'Red Dead Redemption 2'],
];

const foods = [
  ['Arepa', 'Colombia'], ['Bandeja paisa', 'Colombia'], ['Ajiaco', 'Colombia'], ['Tacos', 'Mexico'],
  ['Ceviche', 'Peru'], ['Paella', 'Espana'], ['Sushi', 'Japon'], ['Pizza', 'Italia'],
  ['Feijoada', 'Brasil'], ['Empanada', 'Argentina'], ['Asado', 'Argentina'], ['Croissant', 'Francia'],
  ['Ramen', 'Japon'], ['Poutine', 'Canada'], ['Moussaka', 'Grecia'], ['Feijoada', 'Brasil'],
];

const festivities = [
  ['Dia de Muertos', 'Mexico'], ['Carnaval de Rio', 'Brasil'], ['Oktoberfest', 'Alemania'],
  ['San Fermin', 'Espana'], ['Diwali', 'India'], ['Hanami', 'Japon'],
  ['Thanksgiving', 'Estados Unidos'], ['Ano Nuevo Chino', 'China'], ['Inti Raymi', 'Peru'], ['Tomatina', 'Espana'],
  ['Festival de Vina del Mar', 'Chile'], ['Feria de las Flores', 'Colombia'],
];

const countryLanguage = [
  ['Espana', 'espanol'], ['Mexico', 'espanol'], ['Brasil', 'portugues'], ['Francia', 'frances'],
  ['Italia', 'italiano'], ['Alemania', 'aleman'], ['Japon', 'japones'], ['China', 'mandarin'],
  ['India', 'hindi'], ['Rusia', 'ruso'], ['Reino Unido', 'ingles'], ['Estados Unidos', 'ingles'],
];

function fillToTarget(seedQuestions, target, category) {
  const seen = new Set(seedQuestions.map((x) => normalize(x.q)));
  const out = seedQuestions.slice();
  let guard = 0;
  while (out.length < target && guard < 80000) {
    guard += 1;
    const base = seedQuestions[guard % seedQuestions.length];
    const variants = [
      `${base.q} (seleccion unica)`,
      `${base.q} (edicion semanal)`,
      `${base.q} (reto de conocimiento)`,
    ];
    const q = pick(variants);
    const key = normalize(q);
    if (seen.has(key)) continue;
    const item = {
      ...base,
      q,
      difficulty: nextDifficulty(),
      category,
      source: 'static',
    };
    out.push(item);
    seen.add(key);
  }
  return out.slice(0, target);
}

function buildCategoryBanks() {
  const byCategory = {};

  // GEOGRAFIA
  const geografia = [];
  geografia.push(...expandFacts({
    facts: capitals,
    templates: [
      ({ country }) => `Cual es la capital de ${country}?`,
      ({ country }) => `Selecciona la capital correcta de ${country}.`,
      ({ country }) => `${country} tiene como capital a:`,
    ],
    answerPool: capitals.map(([, c]) => c),
    category: 'geografia',
    getVars: ([country, capital]) => ({ country, correct: capital }),
  }));
  geografia.push(...expandFacts({
    facts: capitals,
    templates: [
      ({ capital }) => `${capital} es capital de que pais?`,
      ({ capital }) => `El pais cuya capital es ${capital} es:`,
    ],
    answerPool: capitals.map(([c]) => c),
    category: 'geografia',
    getVars: ([country, capital]) => ({ capital, correct: country }),
  }));
  geografia.push(...expandFacts({
    facts: countryContinent,
    templates: [
      ({ country }) => `En que continente esta ${country}?`,
      ({ country }) => `${country} pertenece a que continente?`,
    ],
    answerPool: ['America', 'Europa', 'Asia', 'Africa', 'Oceania'],
    category: 'geografia',
    getVars: ([country, continent]) => ({ country, correct: continent }),
  }));
  geografia.push(...expandFacts({
    facts: rivers,
    templates: [
      ({ river }) => `En que continente esta principalmente el rio ${river}?`,
      ({ river }) => `El rio ${river} se ubica sobre todo en:`,
    ],
    answerPool: ['America', 'Europa', 'Asia', 'Africa', 'Oceania'],
    category: 'geografia',
    getVars: ([river, continent]) => ({ river, correct: continent }),
  }));
  byCategory.geografia = fillToTarget(geografia, TARGET_BY_CATEGORY.geografia, 'geografia');

  // HISTORIA
  const historia = [];
  historia.push(...expandFacts({
    facts: events,
    templates: [
      ({ event }) => `En que ano ocurrio ${event}?`,
      ({ event }) => `Selecciona el ano correcto para ${event}.`,
      ({ event }) => `${event} sucedio en el ano:`,
    ],
    answerPool: events.map(([, y]) => y),
    category: 'historia',
    getVars: ([event, year]) => ({ event, correct: year }),
  }));
  historia.push(...expandFacts({
    facts: historicalPeople,
    templates: [
      ({ name }) => `${name} se asocia historicamente con que pais o titulo?`,
      ({ name }) => `En historia, ${name} se relaciona con:`,
      ({ name }) => `Selecciona la opcion correcta sobre ${name}.`,
    ],
    answerPool: historicalPeople.map(([, rel]) => rel),
    category: 'historia',
    getVars: ([name, rel]) => ({ name, correct: rel }),
  }));
  byCategory.historia = fillToTarget(historia, TARGET_BY_CATEGORY.historia, 'historia');

  // MUSICA
  const musica = [];
  musica.push(...expandFacts({
    facts: artists,
    templates: [
      ({ artist }) => `De que pais o region es ${artist}?`,
      ({ artist }) => `${artist} se asocia principalmente con que pais?`,
      ({ artist }) => `Selecciona el origen de ${artist}.`,
    ],
    answerPool: artists.map(([, country]) => country),
    category: 'musica',
    getVars: ([artist, country]) => ({ artist, correct: country }),
  }));
  musica.push(...expandFacts({
    facts: instruments,
    templates: [
      ({ instrument }) => `El instrumento ${instrument} pertenece a que familia?`,
      ({ instrument }) => `${instrument} se clasifica como instrumento de:`,
      ({ instrument }) => `Selecciona la familia de ${instrument}.`,
    ],
    answerPool: ['cuerdas', 'viento', 'percusion', 'teclas', 'electronico'],
    category: 'musica',
    getVars: ([instrument, family]) => ({ instrument, correct: family }),
  }));
  byCategory.musica = fillToTarget(musica, TARGET_BY_CATEGORY.musica, 'musica');

  // ENTRETENIMIENTO
  const entretenimiento = [];
  entretenimiento.push(...expandFacts({
    facts: movies,
    templates: [
      ({ movie }) => `Que personaje o elemento se asocia con la pelicula ${movie}?`,
      ({ movie }) => `En cine, ${movie} se relaciona con:`,
      ({ movie }) => `Selecciona una referencia correcta de ${movie}.`,
    ],
    answerPool: movies.map(([, ref]) => ref),
    category: 'entretenimiento',
    getVars: ([movie, ref]) => ({ movie, correct: ref }),
  }));
  entretenimiento.push(...expandFacts({
    facts: seriesPlatforms,
    templates: [
      ({ series }) => `En que plataforma se conoce principalmente la serie ${series}?`,
      ({ series }) => `${series} suele verse en que plataforma?`,
      ({ series }) => `Selecciona la plataforma asociada a ${series}.`,
    ],
    answerPool: ['Netflix', 'HBO', 'Prime Video', 'Disney+', 'AMC', 'Max', 'Peacock'],
    category: 'entretenimiento',
    getVars: ([series, platform]) => ({ series, correct: platform }),
  }));
  byCategory.entretenimiento = fillToTarget(entretenimiento, TARGET_BY_CATEGORY.entretenimiento, 'entretenimiento');

  // VIDEOJUEGOS
  const videojuegos = [];
  videojuegos.push(...expandFacts({
    facts: games,
    templates: [
      ({ game }) => `Que estudio se asocia con el juego ${game}?`,
      ({ game }) => `${game} fue desarrollado por:`,
      ({ game }) => `Selecciona el estudio vinculado a ${game}.`,
    ],
    answerPool: games.map(([, studio]) => studio),
    category: 'videojuegos',
    getVars: ([game, studio]) => ({ game, correct: studio }),
  }));
  videojuegos.push(...expandFacts({
    facts: gameCharacters,
    templates: [
      ({ character }) => `En que juego aparece ${character}?`,
      ({ character }) => `${character} pertenece a que saga o juego?`,
      ({ character }) => `Selecciona el juego asociado a ${character}.`,
    ],
    answerPool: Array.from(new Set(games.map(([g]) => g).concat(gameCharacters.map(([, g]) => g)))),
    category: 'videojuegos',
    getVars: ([character, game]) => ({ character, correct: game }),
  }));
  byCategory.videojuegos = fillToTarget(videojuegos, TARGET_BY_CATEGORY.videojuegos, 'videojuegos');

  // CULTURA
  const cultura = [];
  cultura.push(...expandFacts({
    facts: foods,
    templates: [
      ({ food }) => `De que pais es tradicional ${food}?`,
      ({ food }) => `${food} se reconoce como plato tipico de:`,
      ({ food }) => `Selecciona el pais asociado a ${food}.`,
    ],
    answerPool: foods.map(([, country]) => country),
    category: 'cultura',
    getVars: ([food, country]) => ({ food, correct: country }),
  }));
  cultura.push(...expandFacts({
    facts: festivities,
    templates: [
      ({ festivity }) => `En que pais se celebra principalmente ${festivity}?`,
      ({ festivity }) => `${festivity} se asocia de forma tradicional con:`,
      ({ festivity }) => `Selecciona el pais relacionado con ${festivity}.`,
    ],
    answerPool: festivities.map(([, country]) => country),
    category: 'cultura',
    getVars: ([festivity, country]) => ({ festivity, correct: country }),
  }));
  cultura.push(...expandFacts({
    facts: countryLanguage,
    templates: [
      ({ country }) => `Cual es el idioma principal de ${country}?`,
      ({ country }) => `En ${country} se habla principalmente:`,
      ({ country }) => `Selecciona el idioma principal asociado a ${country}.`,
    ],
    answerPool: countryLanguage.map(([, language]) => language),
    category: 'cultura',
    getVars: ([country, language]) => ({ country, correct: language }),
  }));
  byCategory.cultura = fillToTarget(cultura, TARGET_BY_CATEGORY.cultura, 'cultura');

  return byCategory;
}

function main() {
  const byCategory = buildCategoryBanks();
  const all = Object.values(byCategory).flat();
  if (all.length !== TARGET_TOTAL) {
    throw new Error(`Total inesperado: ${all.length} (esperado ${TARGET_TOTAL})`);
  }
  fs.writeFileSync(OUTPUT, JSON.stringify(shuffle(all), null, 2), 'utf-8');

  const counts = all.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  const diffs = all.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  console.log(`OK: banco estatico generado (${all.length} preguntas)`);
  console.log('Categorias:', counts);
  console.log('Dificultades:', diffs);
  console.log(`Archivo: ${OUTPUT}`);
}

main();
