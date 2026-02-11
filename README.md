## Trivia Game – Real‑Time Quiz for Friends

This is a small real‑time trivia app built in about **one hour** to play with friends during a casual meetup.  
We could not find a trivia app that was:

- Fast to set up
- Free of logins, subscriptions, and paywalls
- Flexible enough to customize questions and categories on the fly

So this project was created as a lightweight alternative: **open a browser, share a link, and start asking questions**.

---

## Project Overview

- **Purpose**: Run quick trivia games with friends on LAN or over the internet.
- **Roles**:
  - **Host**: creates and controls the game, reveals answers, and monitors the leaderboard.
  - **Players**: join from their own devices and answer questions in real time.
- **Experience goals**:
  - No accounts or authentication.
  - No payments or locked features.
  - Minimal setup friction for casual gatherings.

---

## Tech Stack

- **Client**: Angular (standalone components, SCSS, responsive layout)
- **Server**: Node.js + Express + Socket.IO (real‑time game state and scoring)
- **Optional persistence**: Supabase (Postgres) for storing questions across restarts
- **Deployment examples**:
  - Server on Render
  - Client on Netlify or Vercel  
  (See `DEPLOY.md` for detailed deployment instructions.)

---

## Main Features

- **Lobby & joining**
  - Simple landing page with clear Host / Player entry points.
  - Players join by entering only a **name** – no registration.
  - Host gets a shareable `/play` URL to invite others.

- **Game control for Host**
  - Configure **question count**, **time per question**, and **categories**.
  - Start / pause / resume / stop the game from floating controls.
  - Live **answer distribution** (A/B/C/D) and a live **leaderboard**.
  - Question bank management with categories and optional icons.

- **Player experience**
  - Modern, card‑based UI with a focus on readability on phones.
  - Clear state transitions:
    - Join screen
    - Waiting for the host
    - Playing (question, options, timer, progress)
    - Paused (overlay with spinner and message)
  - Visual feedback on chosen answers and correct option when revealed.

- **Question bank**
  - Ships with a JSON question bank under `server/`.
  - Optional Supabase integration (via environment variables) for persistent storage.

---

## Repository Structure

- `server/` – Node.js + Socket.IO backend  
  - `server.js` – main server entry point  
  - `questions.json` / `static-questions.json` – default question data  
  - `scripts/` – tooling for building and validating static question banks  
  - `supabase-schema.sql` – schema to create the questions table in Supabase

- `client/` – Angular frontend  
  - `src/app/pages/landing/` – landing page (`/`)  
  - `src/app/pages/host/` – host dashboard (`/host`)  
  - `src/app/pages/player/` – player view (`/play`)  
  - `src/app/components/` – reusable components (category multiselect, question form, toasts)  
  - `src/styles.scss` – global theme (colors, typography, layout tokens)

- `DEPLOY.md` – step‑by‑step guide to deploy server and client  
- `render.yaml` / `netlify.toml` – example configs for Render + Netlify

---

## Getting Started (Local Development)

### Prerequisites

- **Node.js** 18 or newer
- **npm** (comes with Node)

Clone the repository:

```bash
git clone https://github.com/Jucapo/trivia.git
cd trivia
```

### 1. Run the Server

```bash
cd server
npm install
npm start
```

By default the server listens on `http://localhost:3000`.

### 2. Configure the Client

Edit `client/src/environments/environment.ts` and `environment.prod.ts` to point to your server URL:

```ts
export const environment = {
  production: false,
  serverUrl: 'http://localhost:3000',
};
```

For production, set `serverUrl` to your deployed server URL (no trailing slash).

### 3. Run the Client (Angular)

```bash
cd client
npm install
npm run start    # or: ng serve
```

Open the app in a browser:

- Host: `http://localhost:4200/host`
- Players: `http://localhost:4200/play`

If you are on the same Wi‑Fi, players can use your local IP instead of `localhost`.

---

## Production Build & Deployment

To create a production build of the client:

```bash
cd client
npm run build
```

The compiled assets will be generated in `client/dist/client/browser` (used by Netlify config) and can be served by any static host.

For a complete deployment walkthrough (Render for the server + Vercel or Netlify for the client, plus optional Supabase), read **`DEPLOY.md`**.

---

## Origin Story

This project started as a **one‑hour hack** during an informal gathering with friends.  
We wanted to run a quick trivia session and discovered that:

- Most trivia apps required **accounts, sign‑ups, or subscriptions**.
- Customization was limited or hidden behind **paywalls**.
- Setup time was too long for a casual meetup.

The goal of this project is not to be a polished commercial product, but rather:

- A **simple, open, and hackable** codebase.
- Something you can **spin up quickly** on a laptop or small server.
- A base you can **fork and adapt** to your own events, questions, or branding.

If you are looking for a fast, no‑nonsense trivia setup for your own “tertulia” with friends, this project is meant to get you there with minimal friction.

---

## Contributing & Customizing

This codebase is intentionally small and approachable:

- You can easily tweak the **color theme** and **UI** in `client/src/styles.scss` and the page‑specific SCSS files.
+- You can adjust scoring or game rules directly in `server/server.js`.
+- You can extend the question model or add new views without dealing with complex state management.

Feel free to fork the repository, customize it for your own groups, and adapt it to other types of live games or quizzes.

---

## License

This project is provided as‑is for personal and educational use.  
Check the repository for the current license terms if you plan to use it in a different context.

