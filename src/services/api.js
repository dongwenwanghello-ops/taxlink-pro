/**
 * TaxLink platform API facade — local-first; no external auth redirects.
 */
import * as auth from "@/services/auth";

function noop() {}

function entityCollection() {
  return {
    async list() {
      return [];
    },
    async filter() {
      return [];
    },
    async get(id) {
      return { id, _localOnly: true };
    },
    async create(payload) {
      return {
        id: `local-${Date.now()}`,
        created_date: new Date().toISOString(),
        ...payload,
      };
    },
    async update(id, payload) {
      return { id, ...payload };
    },
  };
}

export function createPlatformApi() {
  return {
    auth: {
      me: auth.me,
      login: auth.login,
      logout: auth.logout,
      getCurrentUser: auth.getCurrentUser,
      restoreSession: auth.restoreSession,
      isAuthenticated: auth.isAuthenticated,
      /** No-op: never redirect off TaxLink */
      redirectToLogin() {
        console.warn("[taxlink] redirectToLogin ignored — use auth.login() in-app");
        return auth.login();
      },
      loginViaEmailPassword: async (email) => auth.login({ email }),
    },
    analytics: {
      track: noop,
    },
    entities: {
      JobPost: entityCollection(),
      ProfessionalProfile: entityCollection(),
      Review: entityCollection(),
      User: entityCollection(),
      Bid: entityCollection(),
      FeedbackEntry: entityCollection(),
    },
    integrations: {
      Core: {
        async InvokeLLM() {
          return { text: "", _localOnly: true };
        },
      },
    },
  };
}
