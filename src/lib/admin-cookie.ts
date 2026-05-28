/**
 * Costante condivisa tra il middleware (Edge-safe) e il modulo di auth
 * (Node-only). Mantenuta in un file separato per evitare che il middleware
 * importi `node:crypto` via `admin-auth.ts`.
 */
export const ADMIN_COOKIE_NAME = "braga_admin";
