# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## StatusCatch Mobile App (artifacts/statuscatch)

Expo React Native app for the StatusCatch IT Ops monitoring platform.

### Architecture
- Connects to the Railway-hosted backend at `https://statuscatch.up.railway.app`
- Uses Mobile REST API endpoints (`/api/mobile/*`) with bearer token authentication
- Token stored securely via `expo-secure-store` (iOS Keychain / Android Keystore / web localStorage)
- Data fetching via React Query with 30-second polling and pull-to-refresh
- Dark-first theme with light mode support

### Auth Flow
1. User generates a mobile API token from the StatusCatch web app (Settings page)
2. Token is pasted into the mobile app's login screen
3. Token is validated against `GET /api/mobile/dashboard`
4. Stored securely — sent as `Authorization: Bearer <token>` on every request

### API Endpoints Used
- `GET /api/mobile/dashboard` — summary stats, vendor list, active incidents
- `GET /api/mobile/vendors` — vendor subscriptions with incident counts
- `GET /api/mobile/incidents` — paginated incident list with filters (active, type, status, search)
- `GET /api/mobile/incidents/:id` — incident detail with update timeline

### Key Files
- `lib/api.ts` — API client, types, fetch helpers, token management
- `context/AuthContext.tsx` — auth state, login/logout flows
- `context/AppContext.tsx` — local-only state (alert rules via AsyncStorage)
- `app/login.tsx` — token entry login screen
- `app/(tabs)/` — 5-tab layout (Dashboard, Incidents, Vendors, Alerts, Settings)
- `constants/vendors.ts` — vendor status/category enums and display labels
- `constants/colors.ts` — dark/light theme color tokens

### Notes
- Alert Rules tab uses local AsyncStorage only (no mobile alert API endpoints yet)
- Vendor subscription management is read-only; "Manage" links to web app
- `EXPO_PUBLIC_API_URL` env var can override the default Railway URL
