# 🚀 Guía de Setup en Vercel - Paso a Paso

## ✅ Pre-requisitos

- ✅ Cuenta de GitHub (ya la tienes)
- ✅ Repositorio en GitHub (ya está conectado)
- ✅ Servidor backend funcionando (ya tienes Render: `https://triviagame-dpxq.onrender.com`)

## 📋 Paso 1: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza Vercel para acceder a tus repositorios

## 📋 Paso 2: Crear Nuevo Proyecto

1. En el dashboard de Vercel, click en **"Add New..."** → **"Project"**
2. Busca y selecciona tu repositorio `triviaGame` (o el nombre que tenga)
3. Click en **"Import"**

## 📋 Paso 3: Configurar el Proyecto

Vercel debería detectar automáticamente que es Angular, pero verifica estos settings:

### Configuración General:
- **Framework Preset**: `Angular` (debería detectarse automáticamente)
- **Root Directory**: `client` ⚠️ **IMPORTANTE: Cambia esto a `client`**
- **Build Command**: `npm run build` (debería estar automático)
- **Output Directory**: `dist/client/browser` (debería estar automático)
- **Install Command**: `npm install` (debería estar automático)

### Variables de Entorno:
Click en **"Environment Variables"** y agrega:

```
NODE_ENV=production
```

(No necesitas agregar la URL del servidor porque ya está en `environment.prod.ts`)

## 📋 Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (2-3 minutos)
3. ¡Listo! Vercel te dará una URL como: `https://trivia-game-xxxxx.vercel.app`

## 📋 Paso 5: Configurar Dominio Personalizado (Opcional)

Si quieres un dominio personalizado:

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio (ej: `trivia.tudominio.com`)
3. Sigue las instrucciones de DNS que te da Vercel

## 📋 Paso 6: Verificar que Funciona

1. Abre la URL que te dio Vercel
2. Prueba:
   - ✅ Landing page carga
   - ✅ Puedes crear una partida como Host
   - ✅ Puedes unirte como Player desde otro dispositivo/navegador
   - ✅ Las preguntas se muestran correctamente
   - ✅ Socket.IO funciona (respuestas en tiempo real)

## 🔧 Troubleshooting

### Si el build falla:

**Error: "Cannot find module"**
- Verifica que `Root Directory` esté en `client`
- Verifica que `package.json` esté en `client/`

**Error: "Output directory not found"**
- Verifica que `Output Directory` sea `dist/client/browser`
- Revisa `angular.json` para confirmar el path de output

### Si Socket.IO no funciona:

1. Verifica que tu servidor en Render esté activo
2. Verifica que `environment.prod.ts` tenga la URL correcta del servidor
3. Revisa la consola del navegador para errores de CORS

### Si las rutas no funcionan (404 en /host, /play):

- Verifica que `vercel.json` tenga el rewrite configurado
- Vercel debería detectarlo automáticamente, pero si no, el archivo `vercel.json` ya lo tiene configurado

## 💰 Planes de Vercel

### Free Tier (Hobby) - ✅ RECOMENDADO PARA TI
- ✅ Deploys ilimitados
- ✅ 100GB bandwidth/mes
- ✅ Builds ilimitados
- ✅ SSL automático
- ✅ Dominios personalizados
- ✅ **GRATIS**

### Pro Plan ($20/mes)
- Todo lo del Free tier +
- Más bandwidth
- Más builds concurrentes
- Team features

**Para tu caso, el Free tier es más que suficiente.**

## 🎯 Próximos Pasos

Una vez que Vercel esté funcionando:

1. **Actualiza Netlify** (opcional): Puedes pausar el proyecto en Netlify para evitar gastos
2. **Railway para Backend** (opcional): Si Render se duerme mucho, considera migrar el backend a Railway ($5/mes)
3. **Múltiples Proyectos**: Puedes agregar más proyectos en Vercel sin costo adicional

## 📝 Notas Importantes

- ✅ Cada push a `master`/`main` hace deploy automático
- ✅ Puedes crear branches para preview deployments
- ✅ Vercel tiene mejor performance que Netlify en muchos casos
- ✅ No hay límite de deploys (a diferencia de Netlify)

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs de build en Vercel
2. Revisa la consola del navegador
3. Verifica que el servidor backend esté activo
4. Revisa las variables de entorno

---

**¡Listo para deployar! 🚀**
