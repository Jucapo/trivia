# Guía de Migración: Netlify → Vercel + Railway

## 🎯 Estrategia Recomendada

**Frontend (Angular)**: Vercel (gratis, deploys ilimitados)
**Backend (Node.js + Socket.IO)**: Railway ($5/mes) o Render (free tier con limitaciones)

## 📋 Pasos para Migrar

### Opción A: Vercel + Railway (Recomendado)

#### 1. Frontend en Vercel (5 minutos)

1. Ve a [vercel.com](https://vercel.com) y crea cuenta con GitHub
2. Click en "Add New Project"
3. Conecta tu repositorio `triviaGame`
4. Configuración:
   - **Framework Preset**: Angular
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/client/browser`
   - **Install Command**: `npm install`
5. Agrega variable de entorno:
   - `VITE_API_URL` o la que uses para el backend
6. Deploy!

#### 2. Backend en Railway (10 minutos)

1. Ve a [railway.app](https://railway.app) y crea cuenta con GitHub
2. Click en "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repo y configura:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
   - **Build Command**: `npm install`
4. Agrega variables de entorno si las necesitas
5. Railway te dará una URL como: `https://tu-proyecto.up.railway.app`
6. Actualiza la variable de entorno en Vercel con esta URL

### Opción B: Todo en Render (Gratis pero con limitaciones)

Ya tienes `render.yaml` configurado. Solo necesitas:

1. Ve a [render.com](https://render.com) y crea cuenta
2. Conecta tu repositorio
3. Render detectará automáticamente el `render.yaml`
4. Para el frontend, crea otro servicio:
   - **Type**: Static Site
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist/client/browser`

## 💰 Comparación de Costos

| Plataforma | Free Tier | Pago Mensual | Deploys |
|------------|-----------|--------------|---------|
| **Netlify** | 300 créditos/mes | $10/mes | Limitado |
| **Vercel** | Ilimitados | $0 | Ilimitados |
| **Railway** | $5 créditos | $5/mes | Ilimitados |
| **Render** | Free tier | $0 | Limitado (se duerme después de 15min inactivo) |

## ✅ Ventajas de Vercel + Railway

- ✅ Deploys ilimitados en Vercel (gratis)
- ✅ Backend siempre activo en Railway ($5/mes)
- ✅ Configuración mínima (similar a Netlify)
- ✅ Escalable para múltiples proyectos
- ✅ Mejor para producción que Render free tier

## 🔧 Configuración Adicional

### Variables de Entorno

En Vercel (Frontend):
- `VITE_API_URL` o `API_URL` → URL de tu backend en Railway

En Railway (Backend):
- `NODE_ENV=production`
- Cualquier otra variable que necesites (Supabase, etc.)

### CORS en Backend

Asegúrate de que tu `server.js` permita requests desde tu dominio de Vercel:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://tu-app.vercel.app', 'http://localhost:4200']
}));
```

## 🚀 Para Múltiples Proyectos

Con esta configuración puedes:
- Crear múltiples proyectos en Vercel (todos gratis)
- Crear múltiples servicios en Railway (cada uno $5/mes)
- O usar Render free tier para proyectos menos críticos

## 📝 Notas

- Railway tiene un free trial de $5 que puedes usar para probar
- Render free tier "duerme" el servicio después de 15 minutos de inactividad (no ideal para Socket.IO en tiempo real)
- Vercel es perfecto para SPAs como Angular
- Railway es mejor para servicios persistentes como Socket.IO
