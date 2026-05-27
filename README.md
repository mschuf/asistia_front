# asistIAFront

SPA React/Vite para gestión de tickets con autenticación LDAP.

## Requisitos

- Node.js 18+
- Backend `asistia_back` en ejecución

## Arranque

```bash
npm install
cp .env.example .env
npm run dev
```

Por defecto la app corre en `http://localhost:5173` y consume `http://localhost:1001/api/v1`.

## Rutas

- `/login` — autenticación LDAP
- `/tickets` — historial y creación de tickets
- `/assistant` — placeholder del módulo IA

## Documentación

- [Buenas prácticas](./FRONT_BEST_PRACTICES.md)
