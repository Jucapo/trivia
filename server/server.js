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
const QUESTION_TIME_MS = 15000; // 15s por pregunta
const NEXT_DELAY_MS = 1800;     // pausa tras revelar
const MAX_POINTS = 1000;        // puntaje si respondes al instante
const MIN_POINTS = 200;         // puntaje mínimo si respondes al final del tiempo
// ============================================

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const SEED_FILE = path.join(__dirname, 'questions.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function loadQuestionsSync() {
  let seed = [];
  try {
    seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    if (!Array.isArray(seed)) seed = [];
  } catch (e) {
    console.error('No se pudo cargar seed de preguntas:', e.message);
  }
  try {
    if (fs.existsSync(QUESTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('No se pudo cargar banco de preguntas, usando seed:', e.message);
  }
  return seed;
}

function saveQuestionsToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('No se pudo guardar banco de preguntas (p. ej. en hosting solo lectura):', e.message);
    return false;
  }
}

let questions = [];

// REST API: questions
app.get('/api/questions', (req, res) => {
  res.json(questions);
});

app.post('/api/questions', async (req, res) => {
  const { q, options, answer } = req.body || {};
  if (typeof q !== 'string' || !q.trim()) {
    return res.status(400).json({ error: 'Falta el texto de la pregunta (q).' });
  }
  if (!Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ error: 'Se necesitan exactamente 4 opciones (options).' });
  }
  const opts = options.map(o => (typeof o === 'string' ? o : String(o)).trim()).filter(Boolean);
  if (opts.length !== 4) {
    return res.status(400).json({ error: 'Las 4 opciones deben ser texto no vacío.' });
  }
  const ans = Number(answer);
  if (!Number.isInteger(ans) || ans < 0 || ans > 3) {
    return res.status(400).json({ error: 'La respuesta correcta (answer) debe ser 0, 1, 2 o 3.' });
  }
  const newQ = { q: q.trim(), options: opts, answer: ans };

  if (supabase) {
    const { error } = await supabase.from('questions').insert(newQ);
    if (error) {
      return res.status(500).json({ error: error.message || 'Error al guardar en la base de datos.' });
    }
    questions.push(newQ);
  } else {
    questions.push(newQ);
    saveQuestionsToFile();
  }
  res.status(201).json(newQ);
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
  const q = questions[idx];
  const opts = q.options.map((text, i) => ({ text, i }));
  const shuffled = shuffle(opts);
  const correctNewIndex = shuffled.findIndex(o => o.i === q.answer);
  return {
    q: q.q,
    options: shuffled.map(o => o.text),
    correctIndex: correctNewIndex
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
  state.currentOptions = prepared.options;
  state.currentCorrect = prepared.correctIndex;
  state.reveal = false;
  state.startedAt = Date.now();
  resetAnswers();

  io.emit('question', {
    index: idx,
    total: questions.length,
    q: prepared.q,
    options: prepared.options,
    reveal: false,
    correct: null,
    startedAt: state.startedAt,
    durationMs: QUESTION_TIME_MS
  });

  state.timer = setTimeout(() => {
    doReveal();
    state.nextTimer = setTimeout(() => {
      doNext();
    }, NEXT_DELAY_MS);
  }, QUESTION_TIME_MS);
}

function scoreForAnswer(answeredAt) {
  if (!answeredAt || !state.startedAt) return MIN_POINTS;
  const elapsed = Math.max(0, answeredAt - state.startedAt);
  const remaining = Math.max(0, QUESTION_TIME_MS - elapsed);
  const span = Math.max(1, MAX_POINTS - MIN_POINTS);
  const dynamic = MIN_POINTS + Math.floor((remaining / QUESTION_TIME_MS) * span);
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
  if (state.currentIndex + 1 >= questions.length) {
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
        socket.emit('question', {
          index: state.currentIndex,
          total: questions.length,
          q: questions[state.currentIndex].q,
          options: state.currentOptions,
          reveal: state.reveal,
          correct: state.reveal ? state.currentCorrect : null,
          startedAt: state.startedAt,
          durationMs: QUESTION_TIME_MS
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
        socket.emit('question', {
          index: state.currentIndex,
          total: questions.length,
          q: questions[state.currentIndex].q,
          options: state.currentOptions,
          reveal: state.reveal,
          correct: state.reveal ? state.currentCorrect : null,
          startedAt: state.startedAt,
          durationMs: QUESTION_TIME_MS
        });
      }
    }
  });

  socket.on('host:start', () => {
    if (socket.id !== state.hostId) return;
    if (!questions.length) return;
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
  if (supabase) {
    try {
      const { data, error } = await supabase.from('questions').select('q, options, answer');
      if (error) throw error;
      if (data && data.length > 0) {
        questions = data;
        console.log('[server] Preguntas cargadas desde Supabase:', questions.length);
      } else {
        const seed = loadQuestionsSync();
        if (seed.length > 0) {
          const { error: insertErr } = await supabase.from('questions').insert(seed);
          if (insertErr) console.warn('[server] No se pudieron insertar seed en Supabase:', insertErr.message);
          questions = seed;
          console.log('[server] Seed de preguntas insertado en Supabase:', seed.length);
        }
      }
    } catch (e) {
      console.error('[server] Error cargando desde Supabase, usando seed:', e.message);
      questions = loadQuestionsSync();
    }
  } else {
    questions = loadQuestionsSync();
    console.log('[server] Preguntas cargadas desde archivo/seed:', questions.length);
  }

  server.listen(PORT, () => {
    console.log(`Socket server on http://localhost:${PORT}`);
  });
}

start();
