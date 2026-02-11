const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'international-questions.json');

// Datos para generar preguntas internacionales
const countries = {
  // Europa
  'Reino Unido': { capital: 'Londres', idioma: 'inglés', moneda: 'libra esterlina', continente: 'Europa' },
  'Francia': { capital: 'París', idioma: 'francés', moneda: 'euro', continente: 'Europa' },
  'Alemania': { capital: 'Berlín', idioma: 'alemán', moneda: 'euro', continente: 'Europa' },
  'Italia': { capital: 'Roma', idioma: 'italiano', moneda: 'euro', continente: 'Europa' },
  'España': { capital: 'Madrid', idioma: 'español', moneda: 'euro', continente: 'Europa' },
  'Portugal': { capital: 'Lisboa', idioma: 'portugués', moneda: 'euro', continente: 'Europa' },
  'Grecia': { capital: 'Atenas', idioma: 'griego', moneda: 'euro', continente: 'Europa' },
  'Países Bajos': { capital: 'Ámsterdam', idioma: 'neerlandés', moneda: 'euro', continente: 'Europa' },
  'Bélgica': { capital: 'Bruselas', idioma: 'francés/neerlandés', moneda: 'euro', continente: 'Europa' },
  'Suiza': { capital: 'Berna', idioma: 'alemán/francés/italiano', moneda: 'franco suizo', continente: 'Europa' },
  'Austria': { capital: 'Viena', idioma: 'alemán', moneda: 'euro', continente: 'Europa' },
  'Polonia': { capital: 'Varsovia', idioma: 'polaco', moneda: 'złoty', continente: 'Europa' },
  'Rusia': { capital: 'Moscú', idioma: 'ruso', moneda: 'rublo', continente: 'Europa/Asia' },
  'Turquía': { capital: 'Ankara', idioma: 'turco', moneda: 'lira turca', continente: 'Europa/Asia' },
  
  // Asia
  'Japón': { capital: 'Tokio', idioma: 'japonés', moneda: 'yen', continente: 'Asia' },
  'China': { capital: 'Pekín', idioma: 'chino mandarín', moneda: 'yuan', continente: 'Asia' },
  'India': { capital: 'Nueva Delhi', idioma: 'hindi/inglés', moneda: 'rupia', continente: 'Asia' },
  'Corea del Sur': { capital: 'Seúl', idioma: 'coreano', moneda: 'won', continente: 'Asia' },
  'Tailandia': { capital: 'Bangkok', idioma: 'tailandés', moneda: 'baht', continente: 'Asia' },
  'Vietnam': { capital: 'Hanói', idioma: 'vietnamita', moneda: 'dong', continente: 'Asia' },
  'Indonesia': { capital: 'Yakarta', idioma: 'indonesio', moneda: 'rupia', continente: 'Asia' },
  'Filipinas': { capital: 'Manila', idioma: 'filipino/inglés', moneda: 'peso', continente: 'Asia' },
  'Singapur': { capital: 'Singapur', idioma: 'inglés/mandarín/malayo/tamil', moneda: 'dólar', continente: 'Asia' },
  'Malasia': { capital: 'Kuala Lumpur', idioma: 'malayo', moneda: 'ringgit', continente: 'Asia' },
  'Arabia Saudí': { capital: 'Riad', idioma: 'árabe', moneda: 'riyal', continente: 'Asia' },
  'Emiratos Árabes Unidos': { capital: 'Abu Dabi', idioma: 'árabe', moneda: 'dírham', continente: 'Asia' },
  'Israel': { capital: 'Jerusalén', idioma: 'hebreo/árabe', moneda: 'shekel', continente: 'Asia' },
  'Irán': { capital: 'Teherán', idioma: 'persa', moneda: 'rial', continente: 'Asia' },
  
  // América del Norte
  'Estados Unidos': { capital: 'Washington D.C.', idioma: 'inglés', moneda: 'dólar', continente: 'América del Norte' },
  'Canadá': { capital: 'Ottawa', idioma: 'inglés/francés', moneda: 'dólar canadiense', continente: 'América del Norte' },
  'México': { capital: 'Ciudad de México', idioma: 'español', moneda: 'peso', continente: 'América del Norte' },
  
  // América Central y Caribe
  'Cuba': { capital: 'La Habana', idioma: 'español', moneda: 'peso cubano', continente: 'América Central' },
  'Jamaica': { capital: 'Kingston', idioma: 'inglés', moneda: 'dólar jamaiquino', continente: 'América Central' },
  'República Dominicana': { capital: 'Santo Domingo', idioma: 'español', moneda: 'peso', continente: 'América Central' },
  'Costa Rica': { capital: 'San José', idioma: 'español', moneda: 'colón', continente: 'América Central' },
  'Panamá': { capital: 'Ciudad de Panamá', idioma: 'español', moneda: 'balboa', continente: 'América Central' },
  
  // América del Sur
  'Brasil': { capital: 'Brasilia', idioma: 'portugués', moneda: 'real', continente: 'América del Sur' },
  'Argentina': { capital: 'Buenos Aires', idioma: 'español', moneda: 'peso', continente: 'América del Sur' },
  'Chile': { capital: 'Santiago', idioma: 'español', moneda: 'peso', continente: 'América del Sur' },
  'Perú': { capital: 'Lima', idioma: 'español', moneda: 'sol', continente: 'América del Sur' },
  'Ecuador': { capital: 'Quito', idioma: 'español', moneda: 'dólar', continente: 'América del Sur' },
  'Venezuela': { capital: 'Caracas', idioma: 'español', moneda: 'bolívar', continente: 'América del Sur' },
  'Uruguay': { capital: 'Montevideo', idioma: 'español', moneda: 'peso', continente: 'América del Sur' },
  'Paraguay': { capital: 'Asunción', idioma: 'español/guaraní', moneda: 'guaraní', continente: 'América del Sur' },
  'Bolivia': { capital: 'Sucre', idioma: 'español/quechua/aymara', moneda: 'boliviano', continente: 'América del Sur' },
  
  // África
  'Egipto': { capital: 'El Cairo', idioma: 'árabe', moneda: 'libra egipcia', continente: 'África' },
  'Sudáfrica': { capital: 'Ciudad del Cabo/Pretoria/Bloemfontein', idioma: 'inglés/afrikáans/zulú', moneda: 'rand', continente: 'África' },
  'Nigeria': { capital: 'Abuya', idioma: 'inglés', moneda: 'naira', continente: 'África' },
  'Kenia': { capital: 'Nairobi', idioma: 'inglés/suajili', moneda: 'chelín', continente: 'África' },
  'Marruecos': { capital: 'Rabat', idioma: 'árabe/bereber', moneda: 'dírham', continente: 'África' },
  'Argelia': { capital: 'Argel', idioma: 'árabe/francés', moneda: 'dinar', continente: 'África' },
  'Etiopía': { capital: 'Adís Abeba', idioma: 'amárico', moneda: 'birr', continente: 'África' },
  'Ghana': { capital: 'Acra', idioma: 'inglés', moneda: 'cedi', continente: 'África' },
  
  // Oceanía
  'Australia': { capital: 'Canberra', idioma: 'inglés', moneda: 'dólar australiano', continente: 'Oceanía' },
  'Nueva Zelanda': { capital: 'Wellington', idioma: 'inglés/maorí', moneda: 'dólar neozelandés', continente: 'Oceanía' },
};

// Comidas tradicionales por país
const traditionalFoods = {
  'Italia': ['pizza', 'pasta', 'risotto', 'lasaña'],
  'Japón': ['sushi', 'ramen', 'tempura', 'sashimi'],
  'México': ['tacos', 'burritos', 'enchiladas', 'quesadillas'],
  'Francia': ['croissant', 'baguette', 'ratatouille', 'crêpes'],
  'España': ['paella', 'tortilla española', 'gazpacho', 'jamón serrano'],
  'India': ['curry', 'naan', 'biryani', 'samosa'],
  'Tailandia': ['pad thai', 'tom yum', 'green curry', 'mango sticky rice'],
  'China': ['pollo agridulce', 'dim sum', 'pato pekinés', 'wonton'],
  'Grecia': ['moussaka', 'souvlaki', 'tzatziki', 'baklava'],
  'Turquía': ['kebab', 'baklava', 'döner', 'lokum'],
  'Corea del Sur': ['kimchi', 'bulgogi', 'bibimbap', 'kimbap'],
  'Brasil': ['feijoada', 'pão de açúcar', 'brigadeiro', 'caipirinha'],
  'Argentina': ['asado', 'empanadas', 'dulce de leche', 'mate'],
  'Perú': ['ceviche', 'lomo saltado', 'ají de gallina', 'pisco sour'],
  'Vietnam': ['phở', 'bánh mì', 'rollitos primavera', 'bún chả'],
};

// Eventos históricos importantes por país
const historicalEvents = {
  'Estados Unidos': [
    { event: 'Independencia de Estados Unidos', year: 1776, difficulty: 'media' },
    { event: 'Llegada del hombre a la luna', year: 1969, difficulty: 'media' },
    { event: 'Ataque a Pearl Harbor', year: 1941, difficulty: 'alta' },
  ],
  'Francia': [
    { event: 'Revolución Francesa', year: 1789, difficulty: 'media' },
    { event: 'Caída de la Bastilla', year: 1789, difficulty: 'alta' },
  ],
  'Rusia': [
    { event: 'Revolución Rusa', year: 1917, difficulty: 'media' },
    { event: 'Caída del Muro de Berlín', year: 1989, difficulty: 'media' },
  ],
  'Japón': [
    { event: 'Bombardeos atómicos de Hiroshima y Nagasaki', year: 1945, difficulty: 'alta' },
    { event: 'Restauración Meiji', year: 1868, difficulty: 'alta' },
  ],
};

function generateCapitalQuestion(country, data) {
  const wrongCapitals = Object.values(countries)
    .filter(c => c.capital !== data.capital)
    .map(c => c.capital)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [data.capital, ...wrongCapitals].sort(() => Math.random() - 0.5);
  const answer = options.indexOf(data.capital);
  
  return {
    q: `¿Cuál es la capital de ${country}?`,
    options: options,
    answer: answer,
    category: 'geografia',
    difficulty: 'baja',
    source: 'static'
  };
}

function generateLanguageQuestion(country, data) {
  const mainLang = data.idioma.split('/')[0].trim();
  const wrongLanguages = ['español', 'inglés', 'francés', 'alemán', 'italiano', 'portugués', 'chino', 'japonés', 'árabe', 'ruso']
    .filter(l => !mainLang.toLowerCase().includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [mainLang, ...wrongLanguages].sort(() => Math.random() - 0.5);
  const answer = options.indexOf(mainLang);
  
  return {
    q: `¿Cuál es el idioma principal de ${country}?`,
    options: options,
    answer: answer,
    category: 'cultura',
    difficulty: 'baja',
    source: 'static'
  };
}

function generateFoodQuestion(country) {
  if (!traditionalFoods[country]) return null;
  
  const foods = traditionalFoods[country];
  const correctFood = foods[0];
  const wrongFoods = Object.values(traditionalFoods)
    .flat()
    .filter(f => !foods.includes(f))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [correctFood, ...wrongFoods].sort(() => Math.random() - 0.5);
  const answer = options.indexOf(correctFood);
  
  return {
    q: `¿De qué país es tradicional el ${correctFood}?`,
    options: [country, ...Object.keys(traditionalFoods).filter(c => c !== country).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5),
    answer: options.indexOf(country),
    category: 'cultura',
    difficulty: 'media',
    source: 'static'
  };
}

function generateHistoricalQuestion(country) {
  if (!historicalEvents[country]) return null;
  
  const events = historicalEvents[country];
  const selected = events[Math.floor(Math.random() * events.length)];
  
  const wrongYears = [
    selected.year - 10,
    selected.year + 5,
    selected.year - 5,
    selected.year + 20,
    selected.year - 20,
  ].filter(y => y > 0 && y !== selected.year)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [selected.year.toString(), ...wrongYears.map(y => y.toString())].sort(() => Math.random() - 0.5);
  const answer = options.indexOf(selected.year.toString());
  
  return {
    q: `¿En qué año ocurrió ${selected.event} en ${country}?`,
    options: options,
    answer: answer,
    category: 'historia',
    difficulty: selected.difficulty,
    source: 'static'
  };
}

function generateContinentQuestion(country, data) {
  const wrongContinents = ['Europa', 'Asia', 'América del Norte', 'América del Sur', 'África', 'Oceanía']
    .filter(c => c !== data.continente)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [data.continente, ...wrongContinents].sort(() => Math.random() - 0.5);
  const answer = options.indexOf(data.continente);
  
  return {
    q: `¿En qué continente se encuentra ${country}?`,
    options: options,
    answer: answer,
    category: 'geografia',
    difficulty: 'baja',
    source: 'static'
  };
}

function generateCurrencyQuestion(country, data) {
  const wrongCurrencies = Object.values(countries)
    .filter(c => c.moneda !== data.moneda)
    .map(c => c.moneda)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = [data.moneda, ...wrongCurrencies].sort(() => Math.random() - 0.5);
  const answer = options.indexOf(data.moneda);
  
  return {
    q: `¿Cuál es la moneda oficial de ${country}?`,
    options: options,
    answer: answer,
    category: 'cultura',
    difficulty: 'media',
    source: 'static'
  };
}

function main() {
  console.log('Generando preguntas internacionales...\n');
  
  const questions = [];
  const countryList = Object.keys(countries);
  
  // Generar preguntas para cada país
  countryList.forEach(country => {
    const data = countries[country];
    
    // Capital (baja dificultad)
    questions.push(generateCapitalQuestion(country, data));
    
    // Idioma (baja dificultad)
    questions.push(generateLanguageQuestion(country, data));
    
    // Continente (baja dificultad)
    questions.push(generateContinentQuestion(country, data));
    
    // Moneda (media dificultad)
    questions.push(generateCurrencyQuestion(country, data));
    
    // Comida tradicional (media dificultad) - solo si existe
    const foodQ = generateFoodQuestion(country);
    if (foodQ) questions.push(foodQ);
    
    // Evento histórico (media/alta dificultad) - solo si existe
    const histQ = generateHistoricalQuestion(country);
    if (histQ) questions.push(histQ);
  });
  
  // Filtrar preguntas nulas y validar
  const validQuestions = questions.filter(q => {
    if (!q || !q.q || !Array.isArray(q.options) || q.options.length !== 4) return false;
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) return false;
    if (!q.options[q.answer]) return false;
    return true;
  });
  
  console.log(`Total preguntas generadas: ${validQuestions.length}`);
  
  const byDifficulty = validQuestions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Por dificultad:', byDifficulty);
  
  const byCategory = validQuestions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Por categoría:', byCategory);
  
  // Guardar
  fs.writeFileSync(OUTPUT, JSON.stringify(validQuestions, null, 2), 'utf-8');
  console.log(`\n✅ Preguntas guardadas en: ${OUTPUT}`);
  console.log('\n⚠️  Revisa las preguntas antes de agregarlas al banco principal.');
  console.log('   Puedes combinarlas con el archivo static-questions.json existente.');
}

main();
