# Angular LAN Quiz

Este ZIP contiene:

- `server/` → servidor Node + Socket.IO (preguntas y puntaje por tiempo).
- `client-template/` → código fuente Angular (componentes, rutas, estilos).

## Cómo usar

### 1. Server

```bash
cd server
npm install
npm start
```

Servidor en: `http://localhost:3000`

### 2. Cliente Angular

1. Crear proyecto con Angular CLI:

```bash
cd ..
ng new client --standalone --routing --style=css
```

2. Instalar socket.io-client:

```bash
cd client
npm install socket.io-client
```

3. Copiar archivos desde `client-template/src` sobre `client/src`:

- Sobrescribe:
  - `src/main.ts`
  - `src/styles.css`
- Copia todo el contenido de `client-template/src/app` a `client/src/app`
  (reemplaza lo que haya).

4. Levantar Angular:

```bash
ng serve --host 0.0.0.0 --port 4200
```

### 3. Jugar

- Host: `http://TU-IP:4200/host`
- Jugadores (misma WiFi): `http://TU-IP:4200/play`
