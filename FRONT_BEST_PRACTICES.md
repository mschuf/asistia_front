# asistIAFront - Buenas prácticas

## Arquitectura base

- React + Tailwind + `react-icons` sin librerías externas de toast/modal.
- Centralizar HTTP en `src/api/apiClient.ts`.
- Toda llamada API debe usar `apiClient` para backdrop global y JWT expirado.

## Patrón por feature

```text
pages/MiFeaturePage.tsx
hooks/useMiFeature.ts
components/MiFeature/...
types/pages/mi-feature.types.ts
```

## Autenticación

- Sesión vía cookie HttpOnly (`asistia_access_token`); el JWT no se guarda en `localStorage`.
- Usuario y expiración solo en memoria React; al recargar se rehidrata con `GET /auth/me`.
- Login LDAP: obtener clave pública (`GET /auth/public-key`), cifrar contraseña RSA-OAEP y `POST /auth/login` con `{ username, encryptedPassword }`.
- Todas las peticiones HTTP usan `credentials: 'include'` en `apiClient`.
- 401 / `TOKEN_EXPIRED` → logout + redirect `/login` + toast.
- Al iniciar la app se eliminan claves legacy `asistia_*` de `localStorage` si existían.

## UI/UX

- Toast via `ToastContext`.
- Backdrop global en cada request HTTP.
- Modales con `useEscapeKey`.

## Tickets

- Lógica en `useTickets.ts`.
- Componentes puros en `components/Tickets/`.

## Documentación en código

- Todo archivo `.ts`/`.tsx` de lógica debe iniciar con cabecera `@file` y `@description` en español.
- Toda función, método, hook y helper interno debe tener JSDoc en español con `@param`, `@returns` y `@throws` cuando aplique.
- Props de componentes no obvias: JSDoc en la propiedad (ver `components/ui/dialog.tsx`).
- Referencia de estilo: `src/api/apiClient.ts`.
