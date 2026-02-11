# Deploy your Trivia Game so friends can play from anywhere

Right now the game only works on the same WiFi because the client talks to the server at `your-ip:3000`. To play from anywhere you need to:

1. **Deploy the server** (Node + Socket.IO) to a host that supports WebSockets.
2. **Deploy the client** (Angular app) to a static host.
3. **Point the client to your server URL** and share the game link with friends.

---

## Option A: Render (server) + Vercel or Netlify (client) — free tier

### Step 1: Deploy the server on Render

1. Push your project to **GitHub** (if you haven’t already).
2. Go to [render.com](https://render.com) and sign up (free).
3. **New → Web Service**.
4. Connect your repo and choose this project.
5. Set:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Click **Create Web Service**.
7. Wait for the first deploy. Copy your server URL, e.g. `https://trivia-game-server-xxxx.onrender.com`.

**Note:** On the free plan the server may sleep after ~15 minutes of no use. The first visit after that can take 30–60 seconds to wake up.

### Step 2: Point the client to your server

1. Open **`client/src/environments/environment.prod.ts`**.
2. Set `serverUrl` to your Render URL (no trailing slash):

```ts
export const environment = {
  production: true,
  serverUrl: 'https://trivia-game-server-xxxx.onrender.com',
};
```

3. Save the file.

### Step 3: Deploy the client on Vercel (or Netlify)

**Fix build first (if needed):** Run `npm run build` in the `client` folder. If it fails, fix the errors (e.g. add `DecimalPipe` and `NgClass` to your component imports, and fix any “used before initialization” issues). Once the build succeeds, note the output folder (e.g. `dist/client/browser` or `dist/client`).

**Vercel:**

1. Go to [vercel.com](https://vercel.com) and sign up.
2. **Add New → Project** and import your repo.
3. Set **Root Directory** to `client`.
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist/client` (from this project’s build).
6. Deploy. You’ll get a URL like `https://trivia-game-xxx.vercel.app`.

**Netlify:**

1. Go to [netlify.com](https://netlify.com) and sign up.
2. **Add new site → Import from Git** and choose your repo.
3. Set **Base directory** to `client`.
4. **Build command:** `npm run build`
5. **Publish directory:** `dist/client/browser` (or whatever the Angular build outputs).
6. Deploy and use the given URL.

### Step 4: Play with friends

- **Host:** open `https://your-app.vercel.app/host` (or your Netlify URL).
- **Players:** open `https://your-app.vercel.app/play` (or your Netlify URL).

Share the **/play** link; everyone can join from any network.

---

## Option B: Deploy with Render blueprint (server only, then client as above)

If you added the included `render.yaml`:

1. In Render: **New → Blueprint** and connect your repo.
2. Render will create the **trivia-game-server** service from the blueprint.
3. Copy the server URL and do **Step 2** and **Step 3** from Option A (set `serverUrl` and deploy the client to Vercel/Netlify).

---

## Checklist

- [ ] Repo is on GitHub (or GitLab, etc.).
- [ ] Server deployed (e.g. Render) and URL copied.
- [ ] `client/src/environments/environment.prod.ts` has `serverUrl` set to that URL.
- [ ] Client deployed (e.g. Vercel or Netlify).
- [ ] Host opens `/host`, players open `/play` on the deployed client URL.

If the client was already deployed before you set `serverUrl`, trigger a new build and deploy so the production build uses the correct server URL.
