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

- Token/usuario en `AuthContext` + `localStorage` (`asistia_*`).
- Login LDAP: `POST /auth/login` con `{ username, password }`.
- 401 / `TOKEN_EXPIRED` → logout + redirect `/login` + toast.

## UI/UX

- Toast via `ToastContext`.
- Backdrop global en cada request HTTP.
- Modales con `useEscapeKey`.

## Tickets

- Lógica en `useTickets.ts`.
- Componentes puros en `components/Tickets/`.
