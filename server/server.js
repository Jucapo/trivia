// server/server.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

// ==== Configuración de tiempos y puntaje ====
const QUESTION_TIME_MS = 15000; // 15s por pregunta
const NEXT_DELAY_MS = 1800;     // pausa tras revelar
const MAX_POINTS = 1000;        // puntaje si respondes al instante
const MIN_POINTS = 200;         // puntaje mínimo si respondes al final del tiempo
// ============================================

let questions = [];
try {
  questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf-8'));
} catch (e) {
  console.error('No se pudieron cargar preguntas:', e.message);
}

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

server.listen(PORT, () => {
  console.log(`Socket server on http://localhost:${PORT}`);
});
