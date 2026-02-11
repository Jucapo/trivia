// server/server.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.json());

// CORS for REST API (client may be on another origin, e.g. Netlify)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const PORT = process.env.PORT || 3000;

// ==== Configuración de tiempos y puntaje ====
const DEFAULT_QUESTION_TIME_MS = 15000; // 15s por pregunta
const MIN_QUESTION_TIME_MS = 5000;
const MAX_QUESTION_TIME_MS = 60000;
const NEXT_DELAY_MS = 1800;             // pausa tras revelar
const MAX_POINTS = 1000;                // puntaje si respondes al instante
const MIN_POINTS = 200;                 // puntaje mínimo si respondes al final del tiempo
const DEFAULT_DIFFICULTY = 'media';
// ============================================

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USER_QUESTIONS_FILE = path.join(DATA_DIR, 'user-questions.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const STATIC_QUESTIONS_FILE = path.join(__dirname, 'static-questions.json');
const LEGACY_FILE = path.join(__dirname, 'questions.json');

const BASE_CATEGORIES = [
  'cultura',
  'historia',
  'geografia',
  'entretenimiento',
  'videojuegos',
  'musica',
];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function normalizeCategory(name) {
  if (typeof name !== 'string') return 'cultura';
  const v = name.trim().toLowerCase();
  return v || 'cultura';
}

function normalizeDifficulty(value) {
  const v = (typeof value === 'string' ? value.trim().toLowerCase() : DEFAULT_DIFFICULTY);
  if (v === 'baja' || v === 'alta' || v === 'media') return v;
  return DEFAULT_DIFFICULTY;
}

function normalizeQuestion(input, source = 'user') {
  const q = String(input?.q || '').trim();
  const options = Array.isArray(input?.options)
    ? input.options.map((o) => String(o).trim()).filter(Boolean)
    : [];
  const answer = Number(input?.answer);
  const category = normalizeCategory(input?.category || 'cultura');
  const difficulty = normalizeDifficulty(input?.difficulty);
  if (!q || options.length !== 4 || !Number.isInteger(answer) || answer < 0 || answer > 3) {
    return null;
  }
  return {
    q,
    options,
    answer,
    category,
    difficulty,
    source,
  };
}

function loadJsonArraySafe(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function loadStaticQuestionsSync() {
  let seed = loadJsonArraySafe(STATIC_QUESTIONS_FILE);
  if (!seed.length) {
    // Fallback para no romper en entornos viejos
    seed = loadJsonArraySafe(LEGACY_FILE);
  }
  return seed
    .map((q) => normalizeQuestion(q, 'static'))
    .filter(Boolean);
}

function loadUserQuestionsSync() {
  const local = loadJsonArraySafe(USER_QUESTIONS_FILE)
    .map((q) => normalizeQuestion(q, 'user'))
    .filter(Boolean);
  return local;
}

function loadCategoriesSync() {
  const local = loadJsonArraySafe(CATEGORIES_FILE)
    .map((c) => normalizeCategory(typeof c === 'string' ? c : c?.name))
    .filter(Boolean);
  return Array.from(new Set([...BASE_CATEGORIES, ...local]));
}

function ensureDataDirSync() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('No se pudo crear directorio de datos:', e.message);
  }
}

function saveUserQuestionsToFile() {
  try {
    ensureDataDirSync();
    fs.writeFileSync(USER_QUESTIONS_FILE, JSON.stringify(userQuestions, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('No se pudo guardar banco de preguntas de usuario:', e.message);
    return false;
  }
}

function saveCategoriesToFile() {
  try {
    ensureDataDirSync();
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('No se pudo guardar categorias:', e.message);
    return false;
  }
}

function getAllQuestions() {
  return [...staticQuestions, ...userQuestions];
}

function filterByCategory(items, category) {
  if (!category || category === 'todas') return items;
  const c = normalizeCategory(category);
  return items.filter((q) => normalizeCategory(q.category) === c);
}

function filterByCategories(items, categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) return items;
  if (categories.includes('todas')) return items;
  const set = new Set(categories.map((c) => normalizeCategory(c)));
  return items.filter((q) => set.has(normalizeCategory(q.category)));
}

function buildGameQuestions(questionCount, categories) {
  const staticPool = shuffle(filterByCategories(staticQuestions, categories));
  const userPool = shuffle(filterByCategories(userQuestions, categories));

  const targetStatic = Math.ceil(questionCount / 2);
  const targetUser = questionCount - targetStatic;

  const selected = [];
  selected.push(...userPool.splice(0, targetUser));
  selected.push(...staticPool.splice(0, targetStatic));

  let remaining = questionCount - selected.length;
  if (remaining > 0) {
    selected.push(...staticPool.splice(0, remaining));
    remaining = questionCount - selected.length;
  }
  if (remaining > 0) {
    selected.push(...userPool.splice(0, remaining));
  }
  return shuffle(selected).slice(0, questionCount);
}

let staticQuestions = [];
let userQuestions = [];
let categories = [];

// REST API: questions
app.get('/api/questions', (req, res) => {
  const source = String(req.query.source || 'all').toLowerCase();
  if (source === 'static') return res.json(staticQuestions);
  if (source === 'user') return res.json(userQuestions);
  return res.json(getAllQuestions());
});

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', async (req, res) => {
  const rawName = req.body?.name;
  const name = normalizeCategory(rawName);
  if (!name) return res.status(400).json({ error: 'Nombre de categoria invalido.' });
  if (categories.includes(name)) return res.status(200).json({ name, created: false });

  if (supabase) {
    const { error } = await supabase.from('categories').insert({ name });
    if (error) return res.status(500).json({ error: error.message || 'No se pudo crear categoria.' });
  } else {
    categories.push(name);
    saveCategoriesToFile();
  }

  if (!categories.includes(name)) categories.push(name);
  return res.status(201).json({ name, created: true });
});

app.get('/api/catalog', (req, res) => {
  const all = getAllQuestions();
  const counts = {};
  categories.forEach((c) => { counts[c] = 0; });
  all.forEach((q) => {
    const c = normalizeCategory(q.category);
    counts[c] = (counts[c] || 0) + 1;
  });
  res.json({
    categories,
    counts,
    staticCount: staticQuestions.length,
    userCount: userQuestions.length,
    totalCount: all.length,
  });
});

app.post('/api/questions', async (req, res) => {
  const payload = req.body || {};
  const normalized = normalizeQuestion(payload, 'user');
  if (!normalized) {
    return res.status(400).json({ error: 'Pregunta invalida: revisa texto, 4 opciones y respuesta.' });
  }
  if (!categories.includes(normalized.category)) {
    // Auto-crea la categoria si no existe
    if (supabase) {
      const { error: catErr } = await supabase.from('categories').insert({ name: normalized.category });
      if (catErr) return res.status(500).json({ error: catErr.message || 'No se pudo crear categoria.' });
    } else {
      categories.push(normalized.category);
      saveCategoriesToFile();
    }
    if (!categories.includes(normalized.category)) categories.push(normalized.category);
  }

  if (supabase) {
    const { error } = await supabase.from('questions').insert(normalized);
    if (error) {
      return res.status(500).json({ error: error.message || 'Error al guardar en la base de datos.' });
    }
    userQuestions.push(normalized);
  } else {
    userQuestions.push(normalized);
    saveUserQuestionsToFile();
  }
  res.status(201).json(normalized);
});

const state = {
  hostId: null,
  started: false,
  currentIndex: -1,
  reveal: false,
  players: {}, // socketId -> { name, score, answeredIndex, answer, answeredAt }
  currentOptions: null,
  currentCorrect: null,
  startedAt: null,
  questionTimeMs: DEFAULT_QUESTION_TIME_MS,
  gameQuestions: [],
  timer: null,
  nextTimer: null
};

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function resetAnswers() {
  Object.values(state.players).forEach(p => {
    p.answeredIndex = null;
    p.answer = null;
    p.answeredAt = null;
  });
}

function broadcastLobby() {
  io.emit('lobby', {
    started: state.started,
    players: Object.values(state.players).map(p => ({ name: p.name, score: p.score }))
  });
}

function prepareQuestion(idx) {
  const q = state.gameQuestions[idx];
  if (!q) return null;
  const opts = q.options.map((text, i) => ({ text, i }));
  const shuffled = shuffle(opts);
  const correctNewIndex = shuffled.findIndex(o => o.i === q.answer);
  return {
    q: q.q,
    options: shuffled.map(o => o.text),
    correctIndex: correctNewIndex,
    category: q.category || 'cultura',
    difficulty: q.difficulty || 'media',
  };
}

function clearTimers() {
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }
  if (state.nextTimer) { clearTimeout(state.nextTimer); state.nextTimer = null; }
}

function emitQuestion() {
  clearTimers();
  const idx = state.currentIndex;
  const prepared = prepareQuestion(idx);
  if (!prepared) return;
  state.currentOptions = prepared.options;
  state.currentCorrect = prepared.correctIndex;
  state.reveal = false;
  state.startedAt = Date.now();
  resetAnswers();

  io.emit('question', {
    index: idx,
    total: state.gameQuestions.length,
    q: prepared.q,
    options: prepared.options,
    reveal: false,
    correct: null,
    startedAt: state.startedAt,
    durationMs: state.questionTimeMs,
    category: prepared.category,
    difficulty: prepared.difficulty,
  });

  state.timer = setTimeout(() => {
    doReveal();
    state.nextTimer = setTimeout(() => {
      doNext();
    }, NEXT_DELAY_MS);
  }, state.questionTimeMs);
}

function scoreForAnswer(answeredAt) {
  if (!answeredAt || !state.startedAt) return MIN_POINTS;
  const elapsed = Math.max(0, answeredAt - state.startedAt);
  const remaining = Math.max(0, state.questionTimeMs - elapsed);
  const span = Math.max(1, MAX_POINTS - MIN_POINTS);
  const dynamic = MIN_POINTS + Math.floor((remaining / state.questionTimeMs) * span);
  return Math.max(MIN_POINTS, Math.min(MAX_POINTS, dynamic));
}

function doReveal() {
  if (state.reveal) return;
  state.reveal = true;
  const correct = state.currentCorrect;

  Object.values(state.players).forEach(p => {
    const answeredThis = p.answeredIndex === state.currentIndex;
    if (answeredThis && p.answer === correct) {
      p.score += scoreForAnswer(p.answeredAt);
    }
  });

  io.emit('reveal', { correct });
  broadcastLobby();
}

function doNext() {
  if (!state.started) return;
  if (state.currentIndex + 1 >= state.gameQuestions.length) {
    io.emit('end', {
      leaderboard: Object.values(state.players)
        .sort((a, b) => b.score - a.score)
        .map(p => ({ name: p.name, score: p.score }))
    });
    state.started = false;
    state.currentIndex = -1;
    state.reveal = false;
    state.currentOptions = null;
    state.currentCorrect = null;
    state.startedAt = null;
    state.gameQuestions = [];
    clearTimers();
    broadcastLobby();
    return;
  }
  state.currentIndex += 1;
  emitQuestion();
}

io.on('connection', (socket) => {
  console.log('[server] conectado', socket.id);

  socket.on('join', ({ role, name }) => {
    if (role === 'host') {
      state.hostId = socket.id;
      broadcastLobby();
      if (state.started && state.currentIndex >= 0) {
        const raw = state.gameQuestions[state.currentIndex];
        socket.emit('question', {
          index: state.currentIndex,
          total: state.gameQuestions.length,
          q: raw?.q,
          options: state.currentOptions,
          reveal: state.reveal,
          correct: state.reveal ? state.currentCorrect : null,
          startedAt: state.startedAt,
          durationMs: state.questionTimeMs,
          category: raw?.category || 'cultura',
          difficulty: raw?.difficulty || 'media',
        });
      }
    } else {
      let finalName = (name || 'Jugador').trim();
      const existing = Object.values(state.players).map(p => p.name);
      const base = finalName;
      let i = 1;
      while (existing.includes(finalName)) finalName = `${base} ${++i}`;
      state.players[socket.id] = {
        name: finalName,
        score: 0,
        answeredIndex: null,
        answer: null,
        answeredAt: null
      };
      socket.emit('player:joined', { name: finalName });
      broadcastLobby();

      if (state.started && state.currentIndex >= 0) {
        const raw = state.gameQuestions[state.currentIndex];
        socket.emit('question', {
          index: state.currentIndex,
          total: state.gameQuestions.length,
          q: raw?.q,
          options: state.currentOptions,
          reveal: state.reveal,
          correct: state.reveal ? state.currentCorrect : null,
          startedAt: state.startedAt,
          durationMs: state.questionTimeMs,
          category: raw?.category || 'cultura',
          difficulty: raw?.difficulty || 'media',
        });
      }
    }
  });

  socket.on('host:start', (settings = {}) => {
    if (socket.id !== state.hostId) return;
    const all = getAllQuestions();
    if (!all.length) return;
    if (state.started) return;

    const categoriesParam = Array.isArray(settings.categories) && settings.categories.length > 0
      ? settings.categories
      : (typeof settings.category === 'string' && settings.category.trim())
        ? [normalizeCategory(settings.category)]
        : ['todas'];
    const categoryForGame = categoriesParam.includes('todas') ? ['todas'] : categoriesParam;

    state.questionTimeMs = clampInt(
      settings.questionTimeMs,
      MIN_QUESTION_TIME_MS,
      MAX_QUESTION_TIME_MS,
      DEFAULT_QUESTION_TIME_MS,
    );
    const availableByCategory = filterByCategories(all, categoryForGame).length;
    if (!availableByCategory) return;
    const questionCount = clampInt(
      settings.questionCount,
      1,
      availableByCategory,
      availableByCategory,
    );
    state.gameQuestions = buildGameQuestions(questionCount, categoryForGame);
    if (!state.gameQuestions.length) return;

    Object.values(state.players).forEach(p => {
      p.score = 0;
      p.answeredIndex = null;
      p.answer = null;
      p.answeredAt = null;
    });
    state.started = true;
    state.currentIndex = 0;
    emitQuestion();
    broadcastLobby();
  });

  socket.on('host:reveal', () => { if (socket.id === state.hostId) doReveal(); });
  socket.on('host:next', () => { if (socket.id === state.hostId) doNext(); });

  socket.on('player:answer', (idx) => {
    if (!state.started || state.currentIndex < 0 || state.reveal) return;
    const p = state.players[socket.id];
    if (!p) return;
    if (typeof idx !== 'number' || idx < 0 || idx > 3) return;

    p.answer = idx;
    p.answeredIndex = state.currentIndex;
    p.answeredAt = Date.now();

    const counts = [0, 0, 0, 0];
    Object.values(state.players).forEach(pp => {
      if (pp.answeredIndex === state.currentIndex && pp.answer != null) counts[pp.answer]++;
    });
    if (state.hostId) io.to(state.hostId).emit('host:answers', { counts });
  });

  socket.on('disconnect', () => {
    if (socket.id === state.hostId) state.hostId = null;
    delete state.players[socket.id];
    broadcastLobby();
  });
});

async function start() {
  staticQuestions = loadStaticQuestionsSync();
  categories = loadCategoriesSync();

  if (supabase) {
    try {
      await supabase.from('categories').upsert(
        BASE_CATEGORIES.map((name) => ({ name })),
        { onConflict: 'name' },
      );
      const { data: cData, error: cErr } = await supabase.from('categories').select('name');
      if (cErr) throw cErr;
      categories = Array.from(new Set([
        ...BASE_CATEGORIES,
        ...(cData || []).map((c) => normalizeCategory(c.name)),
      ]));

      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('q, options, answer, category, difficulty, source');
      if (qErr) throw qErr;
      userQuestions = (qData || [])
        .map((q) => normalizeQuestion({ ...q, source: q.source || 'user' }, 'user'))
        .filter(Boolean);
      console.log('[server] Preguntas cargadas: static=%d user=%d total=%d', staticQuestions.length, userQuestions.length, getAllQuestions().length);
    } catch (e) {
      console.error('[server] Error cargando desde Supabase, usando archivos locales:', e.message);
      userQuestions = loadUserQuestionsSync();
    }
  } else {
    userQuestions = loadUserQuestionsSync();
    categories = loadCategoriesSync();
    console.log('[server] Preguntas cargadas localmente: static=%d user=%d total=%d', staticQuestions.length, userQuestions.length, getAllQuestions().length);
  }

  server.listen(PORT, () => {
    console.log(`Socket server on http://localhost:${PORT}`);
  });
}

start();
