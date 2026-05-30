/**
 * TaxLink platform API facade — local-first; no external auth redirects.
 */
import * as auth from "@/services/auth";
import { entityApis } from "@/services/entityStore";

function noop() {}

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
      JobPost: entityApis.JobPost,
      ProfessionalProfile: entityApis.ProfessionalProfile,
      Review: entityApis.Review,
      User: entityApis.User,
      Bid: entityApis.Bid,
      Workspace: entityApis.Workspace,
      FeedbackEntry: entityApis.FeedbackEntry,
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
