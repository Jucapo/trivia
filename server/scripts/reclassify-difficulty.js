const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'static-questions.json');
const OUTPUT = path.join(__dirname, '..', 'static-questions-reclassified.json');

// Patrones para identificar dificultad basada en contenido
const BAJA_PATTERNS = [
  // Capitales principales y muy conocidas
  /capital.*(españa|francia|italia|alemania|reino unido|estados unidos|méxico|brasil|argentina|chile|perú|japón|china|india|rusia|canadá|australia)/i,
  // Idiomas principales muy conocidos
  /idioma.*(españa|francia|italia|alemania|reino unido|estados unidos|méxico|brasil|argentina|japón|china|india|rusia)/i,
  /habla.*(español|inglés|francés|italiano|alemán|portugués|japonés|chino|hindi|ruso)/i,
  // Datos geográficos básicos
  /capital.*(madrid|parís|roma|berlín|londres|washington|méxico|brasilia|buenos aires|santiago|lima|tokio|beijing|nueva delhi|moscú|ottawa|canberra)/i,
  // Comidas tradicionales muy conocidas
  /tradicional.*(pizza|pasta|croissant|sushi|tacos|paella|curry|hamburguesa|fish and chips)/i,
  // Datos culturales básicos
  /moneda.*(euro|dólar|yen|libra|peso)/i,
];

const MEDIA_PATTERNS = [
  // Capitales menos conocidas pero importantes
  /capital.*(bolivia|ecuador|venezuela|uruguay|paraguay|guatemala|honduras|el salvador|nicaragua|costa rica|panamá|cuba|república dominicana|haití|jamaica|trinidad|barbados|belice|guyana|surinam|guyana francesa)/i,
  // Fechas históricas importantes pero conocidas
  /año.*(1492|1776|1789|1914|1917|1939|1945|1969|1989|2001)/i,
  // Eventos históricos importantes
  /(revolución|guerra|independencia|descubrimiento|caída del muro|llegada a la luna|atentado)/i,
  // Cultura intermedia
  /festival.*(viña del mar|cannes|venecia|berlín|sundance)/i,
  // Geografía intermedia
  /país.*(montaña|desierto|río|océano|continente)/i,
];

const ALTA_PATTERNS = [
  // Fechas muy específicas y menos conocidas
  /año.*(1[0-9]{3}|[0-9]{4})/i, // Fechas antiguas o muy específicas
  // Datos muy específicos
  /(año exacto|fecha específica|detalle histórico|nombre completo|apellido|segundo nombre)/i,
  // Cultura muy específica
  /(obra específica|artista específico|película específica|canción específica|libro específico)/i,
  // Geografía muy específica
  /(segunda ciudad|tercera ciudad|región específica|provincia específica|estado específico)/i,
  // Datos técnicos o especializados
  /(tecnología específica|invento específico|científico específico|teoría específica)/i,
];

function classifyDifficulty(question) {
  const qText = question.q.toLowerCase();
  const optionsText = question.options.join(' ').toLowerCase();
  const fullText = qText + ' ' + optionsText;

  // Verificar si es una pregunta muy básica (baja)
  for (const pattern of BAJA_PATTERNS) {
    if (pattern.test(fullText)) {
      // Verificar que no tenga elementos de alta dificultad
      const hasHighElements = ALTA_PATTERNS.some(p => p.test(fullText));
      if (!hasHighElements) {
        return 'baja';
      }
    }
  }

  // Verificar si es una pregunta muy específica (alta)
  for (const pattern of ALTA_PATTERNS) {
    if (pattern.test(fullText)) {
      return 'alta';
    }
  }

  // Verificar si tiene elementos de dificultad media
  const hasMediaElements = MEDIA_PATTERNS.some(p => p.test(fullText));
  if (hasMediaElements) {
    return 'media';
  }

  // Reglas adicionales basadas en el contenido
  // Preguntas sobre idiomas principales de países grandes = baja
  if (/idioma principal|se habla|idioma.*principal/i.test(qText)) {
    const majorCountries = /(españa|francia|italia|alemania|reino unido|estados unidos|méxico|brasil|japón|china|india|rusia|argentina|chile|perú|colombia)/i;
    if (majorCountries.test(fullText)) {
      return 'baja';
    }
  }

  // Preguntas sobre capitales de países grandes = baja
  if (/capital.*(españa|francia|italia|alemania|reino unido|estados unidos|méxico|brasil|japón|china|india|rusia|argentina|chile|perú|colombia)/i.test(fullText)) {
    return 'baja';
  }

  // Preguntas sobre fechas históricas muy conocidas = media
  if (/año.*(1492|1776|1789|1914|1917|1939|1945|1969)/i.test(fullText)) {
    return 'media';
  }

  // Preguntas sobre fechas muy específicas o antiguas = alta
  if (/año.*([0-9]{4})/i.test(qText)) {
    const yearMatch = qText.match(/año.*?(\d{4})/i);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      // Años muy antiguos o muy específicos = alta
      if (year < 1000 || (year > 2000 && year < 2020)) {
        return 'alta';
      }
    }
  }

  // Por defecto, mantener la dificultad original si no se puede determinar claramente
  return question.difficulty;
}

function main() {
  console.log('Recalificando dificultades de preguntas...\n');
  
  const questions = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`Total preguntas: ${questions.length}`);

  const stats = {
    original: { baja: 0, media: 0, alta: 0 },
    new: { baja: 0, media: 0, alta: 0 },
    changed: 0,
    changes: []
  };

  const reclassified = questions.map((q, idx) => {
    const original = q.difficulty;
    const newDiff = classifyDifficulty(q);
    
    stats.original[original]++;
    stats.new[newDiff]++;
    
    if (original !== newDiff) {
      stats.changed++;
      stats.changes.push({
        index: idx + 1,
        question: q.q.substring(0, 60) + '...',
        original,
        new: newDiff
      });
    }
    
    return {
      ...q,
      difficulty: newDiff
    };
  });

  console.log('\nEstadísticas:');
  console.log('Original:', stats.original);
  console.log('Nueva:', stats.new);
  console.log(`\nCambios realizados: ${stats.changed} de ${questions.length}`);
  
  if (stats.changes.length > 0) {
    console.log('\nPrimeros 20 cambios:');
    stats.changes.slice(0, 20).forEach(c => {
      console.log(`  [${c.index}] ${c.original} → ${c.new}: ${c.question}`);
    });
  }

  // Guardar resultado
  fs.writeFileSync(OUTPUT, JSON.stringify(reclassified, null, 2), 'utf-8');
  console.log(`\n✅ Archivo guardado en: ${OUTPUT}`);
  console.log('\n⚠️  Revisa el archivo antes de reemplazar el original.');
  console.log('   Para aplicar los cambios, renombra el archivo:');
  console.log(`   mv ${OUTPUT} ${INPUT}`);
}

main();
