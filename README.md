# 🎾 PádelRank — Guía de despliegue completa

## Estructura del proyecto

```
padel-ranking/
├── src/
│   ├── main.jsx              ← Entrada de React
│   ├── App.jsx               ← Router + Auth gate
│   ├── firebase.js           ← Config Firebase
│   ├── elo.js                ← Lógica ELO + sets
│   ├── audit.js              ← Escritura de auditoría
│   ├── hooks/
│   │   ├── useAuth.js        ← Google Auth + perfil
│   │   └── useNotifications.js ← Buzón en tiempo real
│   ├── components/
│   │   ├── Layout.jsx        ← Nav + header
│   │   └── UI.jsx            ← Avatar, TierBadge, etc.
│   ├── pages/
│   │   ├── LoginPage.jsx     ← Pantalla login Google
│   │   ├── RankingPage.jsx   ← Ranking oficial con pódium
│   │   ├── MatchPage.jsx     ← Nuevo partido + editar
│   │   ├── ProfilePage.jsx   ← Perfil, pala, lado, historial
│   │   ├── InboxPage.jsx     ← Buzón de notificaciones
│   │   └── AuditPage.jsx     ← Auditoría (solo admin)
│   └── styles/
│       └── global.css        ← Tema oscuro verde WPT
├── index.html
├── vite.config.js
├── package.json
├── firestore.rules           ← Reglas de seguridad
├── firestore.indexes.json    ← Índices compuestos
└── .env.example              ← Variables de entorno 
```

---

## Paso 1 — Crear proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. Haz clic en **"Agregar proyecto"**
3. Ponle nombre (ej: `padel-ranking`) y sigue el asistente
4. En la consola del proyecto: **Build → Authentication**
   - Haz clic en **"Comenzar"**
   - En la pestaña **"Sign-in method"**, activa **Google**
   - Guarda

---

## Paso 2 — Crear la base de datos Firestore

1. En Firebase Console: **Build → Firestore Database**
2. Haz clic en **"Crear base de datos"**
3. Elige **modo de producción** (usaremos nuestras reglas)
4. Elige la región más cercana (ej: `eur3` para Europa)

---

## Paso 3 — Obtener las credenciales de tu app web

1. En Firebase Console: **⚙️ Configuración del proyecto → General**
2. Baja hasta "Tus apps" → haz clic en **"</> Web"**
3. Registra la app (nombre: `padel-ranking-web`)
4. Copia el objeto `firebaseConfig` que aparece

---

## Paso 4 — Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (copia `.env.example`):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=padel-ranking.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=padel-ranking
VITE_FIREBASE_STORAGE_BUCKET=padel-ranking.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Tu UID de admin (ver Paso 5)
VITE_ADMIN_UID=tu_uid_aqui
```

---

## Paso 5 — Configurar tu cuenta como admin

Hay dos lugares donde tienes que poner tu identidad de admin:

### A) En `.env`:
```
VITE_ADMIN_UID=tu_uid_aqui
```

### B) En `firestore.rules`:
```
function isAdmin() { return request.auth.token.email == "tu@email.com"; }
```

**¿Cómo saber tu UID?**
1. Despliega la app (Paso 8)
2. Entra con tu Google
3. Ve a Firebase Console → **Authentication → Users**
4. Copia el UID que aparece junto a tu email

---

## Paso 6 — Desplegar las reglas de seguridad

### Opción A (recomendada): desde Firebase Console
1. Ve a **Firestore → Reglas**
2. Copia el contenido de `firestore.rules` y pégalo
3. Haz clic en **"Publicar"**

### Opción B: con Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # selecciona tu proyecto
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Paso 7 — Instalar dependencias y desarrollar en local

```bash
cd padel-ranking
npm install
npm run dev
```

Abre http://localhost:5173 — deberías ver la pantalla de login.

---

## Paso 8 — Desplegar en producción (Vercel, recomendado)

1. Sube el proyecto a GitHub
2. Ve a https://vercel.com → **"New Project"**
3. Importa tu repositorio
4. En **Environment Variables**, añade todas las variables de `.env`
5. Haz clic en **"Deploy"**

Vercel te dará una URL pública tipo `padel-ranking.vercel.app`.

### Autorizar el dominio en Firebase Auth
1. Ve a Firebase Console → **Authentication → Settings → Authorized domains**
2. Añade tu dominio de Vercel (`padel-ranking.vercel.app`)

---

## Paso 9 — Primer uso

1. Entra con tu Google → se crea tu perfil automáticamente
2. Ve a **Perfil** → configura tu pala y lado preferido
3. Invita a los demás jugadores a entrar con su Google
4. Registra el primer partido desde la pestaña **Partido**

---

## Cómo funciona el sistema ELO

- Todos empiezan con **1000 puntos**
- Al registrar un partido, el sistema calcula cuántos puntos gana/pierde cada jugador
- Si ganas a una pareja con más ELO que tú → subes muchos puntos
- Si ganas a una pareja más débil → subes pocos puntos
- K=32 (ajuste estándar de ajedrez)

## Tiers

| Tier     | ELO mínimo |
|----------|------------|
| Bronce   | 0          |
| Plata    | 950        |
| Oro      | 1100       |
| Platino  | 1250       |
| Diamante | 1400       |

---

## Auditoría

- Solo tú (el admin) puedes ver la página de auditoría
- Accede desde el botón **🛡 Auditoría** en el header
- Registra: logins, registros, cambios de perfil, partidos creados y editados
- Los registros de auditoría **nunca se pueden borrar** (por reglas de Firestore)

---

## Notas de seguridad

- Las reglas de Firestore impiden que un jugador edite un partido en el que no participa
- La auditoría se escribe desde el cliente pero solo el admin puede leerla
- Los tokens de Firebase expiran y se renuevan automáticamente
- **No subas el `.env` a GitHub** — añádelo a `.gitignore`
