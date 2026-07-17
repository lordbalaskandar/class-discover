import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cognito, COGNITO_CLIENT_ID, cryptoRandomPassword } from "./api";

// v2: invalidates any legacy sessions that may have persisted IdToken as accessToken.
const STORAGE_KEY_BASE = "pulstract-mobile-auth-v2";

/**
 * Auth scope — the User app and Host app are separate apps that share the same
 * Cognito user pool. Each scope persists its session under a distinct storage
 * key so a signed-in User does not leak a session into the Host phone.
 */
export type AuthScope = "user" | "host" | "default";

export type PulstractSession = {
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  scope: AuthScope;
};

type Ctx = {
  scope: AuthScope;
  session: PulstractSession | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, name: string) => Promise<void>;
  signOut: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function PulstractAuthProvider({ children, scope = "default" }: { children: ReactNode; scope?: AuthScope }) {
  const [session, setSession] = useState<PulstractSession | null>(null);
  const [loading, setLoading] = useState(false);
  const storageKey = `${STORAGE_KEY_BASE}:${scope}`;

  // Hydrate persisted session on mount / when scope changes
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      setSession(raw ? (JSON.parse(raw) as PulstractSession) : null);
    } catch {
      setSession(null);
    }
  }, [storageKey]);

  const persist = useCallback((s: PulstractSession | null) => {
    setSession(s);
    try {
      if (s) window.localStorage.setItem(storageKey, JSON.stringify(s));
      else window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const signIn = useCallback(
    async (email: string, password?: string) => {
      setLoading(true);
      try {
        const res: any = await cognito("InitiateAuth", {
          ClientId: COGNITO_CLIENT_ID,
          AuthFlow: password ? "USER_PASSWORD_AUTH" : "CUSTOM_AUTH",
          AuthParameters: password
            ? { USERNAME: email, PASSWORD: password }
            : { USERNAME: email },
        });
        const r = res.AuthenticationResult;
        if (!r) throw new Error("Sign-in did not return tokens");
        persist({
          email,
          name: email.split("@")[0],
          accessToken: r.AccessToken,
          refreshToken: r.RefreshToken,
          idToken: r.IdToken,
          scope,
        });
      } finally {
        setLoading(false);
      }
    },
    [persist, scope],
  );

  const signUp = useCallback(
    async (email: string, name: string) => {
      setLoading(true);
      try {
        try {
          await cognito("SignUp", {
            ClientId: COGNITO_CLIENT_ID,
            Username: email,
            Password: cryptoRandomPassword(),
            UserAttributes: [
              { Name: "email", Value: email },
              { Name: "name", Value: name },
            ],
          });
        } catch (e: any) {
          if (!/UsernameExists/i.test(String(e?.message))) throw e;
        }
        // Auto sign-in immediately (dev backend auto-confirms).
        const res: any = await cognito("InitiateAuth", {
          ClientId: COGNITO_CLIENT_ID,
          AuthFlow: "CUSTOM_AUTH",
          AuthParameters: { USERNAME: email },
        });
        const r = res.AuthenticationResult;
        if (!r) throw new Error("Sign-up completed but sign-in did not return tokens");
        persist({
          email,
          name,
          accessToken: r.AccessToken,
          refreshToken: r.RefreshToken,
          idToken: r.IdToken,
          scope,
        });
      } finally {
        setLoading(false);
      }
    },
    [persist, scope],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const value = useMemo<Ctx>(
    () => ({ scope, session, loading, signIn, signUp, signOut }),
    [scope, session, loading, signIn, signUp, signOut],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function usePulstractAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("usePulstractAuth must be used inside <PulstractAuthProvider>");
  return ctx;
}

/** Convenience: throws if not signed in. Use inside gated screens. */
export function useAccessToken(): string {
  const { session } = usePulstractAuth();
  if (!session) throw new Error("Not signed in");
  return session.accessToken;
}
