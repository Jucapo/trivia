const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'static-questions.json');
const EXPECTED_CATEGORIES = ['cultura', 'historia', 'geografia', 'entretenimiento', 'videojuegos', 'musica'];
const EXPECTED_DIFFICULTIES = ['baja', 'media', 'alta'];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[?¿!¡.,:;()'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  if (!Array.isArray(data)) throw new Error('El archivo static-questions.json no contiene un array.');

  const errors = [];
  const seen = new Set();
  const byCategory = {};
  const byDifficulty = {};
  const bannedPatterns = [/version\s+\d+/i, /serie\s+\d+/i, /pregunta\s+\d+/i];

  for (let i = 0; i < data.length; i += 1) {
    const q = data[i];
    const idx = i + 1;
    if (!q || typeof q !== 'object') {
      errors.push(`Fila ${idx}: no es objeto valido.`);
      continue;
    }
    if (!q.q || typeof q.q !== 'string' || q.q.trim().length < 8) {
      errors.push(`Fila ${idx}: texto de pregunta invalido.`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`Fila ${idx}: opciones invalidas (deben ser 4).`);
    } else {
      const optSet = new Set(q.options.map((o) => normalize(o)));
      if (optSet.size !== 4) errors.push(`Fila ${idx}: opciones repetidas.`);
      if (q.options.some((o) => String(o).trim().length < 2)) {
        errors.push(`Fila ${idx}: opcion muy corta/vacia.`);
      }
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
      errors.push(`Fila ${idx}: answer fuera de rango.`);
    }
    if (!EXPECTED_CATEGORIES.includes(q.category)) {
      errors.push(`Fila ${idx}: categoria invalida (${q.category}).`);
    }
    if (!EXPECTED_DIFFICULTIES.includes(q.difficulty)) {
      errors.push(`Fila ${idx}: dificultad invalida (${q.difficulty}).`);
    }
    if (q.source !== 'static') {
      errors.push(`Fila ${idx}: source debe ser 'static'.`);
    }
    const key = normalize(q.q);
    if (seen.has(key)) errors.push(`Fila ${idx}: pregunta repetida detectada.`);
    seen.add(key);

    if (bannedPatterns.some((re) => re.test(q.q))) {
      errors.push(`Fila ${idx}: pregunta con patron no permitido (${q.q}).`);
    }

    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
  }

  EXPECTED_CATEGORIES.forEach((cat) => {
    if ((byCategory[cat] || 0) < 120) {
      errors.push(`Cobertura baja en categoria ${cat}: ${byCategory[cat] || 0}`);
    }
  });

  const total = data.length;
  console.log(`Total preguntas: ${total}`);
  console.log('Por categoria:', byCategory);
  console.log('Por dificultad:', byDifficulty);

  if (errors.length) {
    console.error('\nErrores de validacion:');
    errors.slice(0, 60).forEach((e) => console.error(`- ${e}`));
    if (errors.length > 60) console.error(`... y ${errors.length - 60} errores mas`);
    process.exit(1);
  }
  console.log('\nValidacion OK.');
}

main();
