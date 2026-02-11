const fs = require('fs');
const path = require('path');

const ORIGINAL = path.join(__dirname, '..', 'static-questions.json');
const RECLASSIFIED = path.join(__dirname, '..', 'static-questions-reclassified.json');
const INTERNATIONAL = path.join(__dirname, '..', 'international-questions.json');
const OUTPUT = path.join(__dirname, '..', 'static-questions-final.json');

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[?¿!¡.,:;()'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  console.log('Combinando preguntas...\n');
  
  // Cargar preguntas recalificadas (o originales si no existe el recalificado)
  let reclassifiedPath = RECLASSIFIED;
  if (!fs.existsSync(reclassifiedPath)) {
    console.log('⚠️  No se encontró archivo recalificado, usando original...');
    reclassifiedPath = ORIGINAL;
  }
  
  const originalQuestions = JSON.parse(fs.readFileSync(reclassifiedPath, 'utf-8'));
  console.log(`Preguntas originales: ${originalQuestions.length}`);
  
  // Cargar preguntas internacionales
  if (!fs.existsSync(INTERNATIONAL)) {
    console.error('❌ No se encontró el archivo de preguntas internacionales.');
    console.log('   Ejecuta primero: node generate-international-questions.js');
    process.exit(1);
  }
  
  const internationalQuestions = JSON.parse(fs.readFileSync(INTERNATIONAL, 'utf-8'));
  console.log(`Preguntas internacionales nuevas: ${internationalQuestions.length}`);
  
  // Filtrar duplicados (por texto de pregunta normalizado)
  const seen = new Set();
  originalQuestions.forEach(q => {
    seen.add(normalize(q.q));
  });
  
  const uniqueInternational = internationalQuestions.filter(q => {
    const normalized = normalize(q.q);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
  
  console.log(`Preguntas internacionales únicas: ${uniqueInternational.length}`);
  
  // Combinar
  const combined = [...originalQuestions, ...uniqueInternational];
  console.log(`Total preguntas combinadas: ${combined.length}`);
  
  // Estadísticas finales
  const byDifficulty = combined.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nPor dificultad:', byDifficulty);
  
  const byCategory = combined.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Por categoría:', byCategory);
  
  // Contar preguntas sobre Colombia
  const colombia = combined.filter(q => 
    q.q.toLowerCase().includes('colombia') || 
    q.options.some(o => o.toLowerCase().includes('colombia') || o.toLowerCase().includes('bogota'))
  );
  console.log(`\nPreguntas sobre Colombia: ${colombia.length} (${(colombia.length/combined.length*100).toFixed(1)}%)`);
  
  // Guardar
  fs.writeFileSync(OUTPUT, JSON.stringify(combined, null, 2), 'utf-8');
  console.log(`\n✅ Archivo combinado guardado en: ${OUTPUT}`);
  console.log('\n⚠️  Revisa el archivo antes de reemplazar el original.');
  console.log('   Para aplicar los cambios:');
  console.log(`   mv ${OUTPUT} ${ORIGINAL}`);
}

main();
