/**
 * External providers register here only — components must not import vendor SDKs.
 */
import * as auth from "@/services/auth";
import { createPlatformApi } from "@/services/api";

const api = createPlatformApi();

export const providers = {
  auth,
  api,
};

/** Platform API (entities, analytics) — local-first */
export { api };

/** Auth API — use in components: import { auth } from '@/config/providers' */
export { auth };

export function getApi() {
  return providers.api;
}

export function getAuth() {
  return providers.auth;
}
