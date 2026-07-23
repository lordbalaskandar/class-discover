import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cognito, COGNITO_CLIENT_ID, cryptoRandomPassword } from "./api";

// v2: invalidates any legacy sessions that may have persisted IdToken as accessToken.
const STORAGE_KEY_BASE = "pulstract-mobile-auth-v2";

export type AuthScope = "user" | "host" | "default";

export type PulstractSession = {
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  scope: AuthScope;
};

export type PendingConfirmation = {
  email: string;
  name: string;
  destination?: string;
};

type Ctx = {
  scope: AuthScope;
  session: PulstractSession | null;
  loading: boolean;
  pendingConfirmation: PendingConfirmation | null;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, name: string) => Promise<void>;
  confirmSignUp: (code: string) => Promise<void>;
  resendConfirmationCode: () => Promise<void>;
  cancelConfirmation: () => void;
  signOut: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function PulstractAuthProvider({ children, scope = "default" }: { children: ReactNode; scope?: AuthScope }) {
  const [session, setSession] = useState<PulstractSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const storageKey = `${STORAGE_KEY_BASE}:${scope}`;

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

  const initiateCustomAuth = useCallback(
    async (email: string, name: string) => {
      const res: any = await cognito("InitiateAuth", {
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: "CUSTOM_AUTH",
        AuthParameters: { USERNAME: email },
      });
      const r = res.AuthenticationResult;
      if (!r) throw new Error("Sign-in did not return tokens");
      persist({
        email,
        name,
        accessToken: r.AccessToken,
        refreshToken: r.RefreshToken,
        idToken: r.IdToken,
        scope,
      });
    },
    [persist, scope],
  );

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
      } catch (e: any) {
        // If the account exists but hasn't verified the email, drop into confirmation.
        if (/UserNotConfirmed/i.test(String(e?.message))) {
          setPendingConfirmation({ email, name: email.split("@")[0] });
        }
        throw e;
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
        let userConfirmed = false;
        let destination: string | undefined;
        try {
          const res: any = await cognito("SignUp", {
            ClientId: COGNITO_CLIENT_ID,
            Username: email,
            Password: cryptoRandomPassword(),
            UserAttributes: [
              { Name: "email", Value: email },
              { Name: "name", Value: name },
            ],
          });
          userConfirmed = Boolean(res?.UserConfirmed);
          destination = res?.CodeDeliveryDetails?.Destination;
        } catch (e: any) {
          if (!/UsernameExists/i.test(String(e?.message))) throw e;
          // account already exists — attempt sign-in; if unconfirmed, resend code
          try {
            await initiateCustomAuth(email, name);
            return;
          } catch (signInErr: any) {
            if (/UserNotConfirmed/i.test(String(signInErr?.message))) {
              try {
                const rc: any = await cognito("ResendConfirmationCode", {
                  ClientId: COGNITO_CLIENT_ID,
                  Username: email,
                });
                destination = rc?.CodeDeliveryDetails?.Destination;
              } catch {
                /* ignore */
              }
              setPendingConfirmation({ email, name, destination });
              return;
            }
            throw signInErr;
          }
        }

        if (userConfirmed) {
          await initiateCustomAuth(email, name);
        } else {
          setPendingConfirmation({ email, name, destination });
        }
      } finally {
        setLoading(false);
      }
    },
    [initiateCustomAuth],
  );

  const confirmSignUp = useCallback(
    async (code: string) => {
      if (!pendingConfirmation) throw new Error("No pending confirmation");
      setLoading(true);
      try {
        await cognito("ConfirmSignUp", {
          ClientId: COGNITO_CLIENT_ID,
          Username: pendingConfirmation.email,
          ConfirmationCode: code.trim(),
        });
        const { email, name } = pendingConfirmation;
        setPendingConfirmation(null);
        await initiateCustomAuth(email, name);
      } finally {
        setLoading(false);
      }
    },
    [pendingConfirmation, initiateCustomAuth],
  );

  const resendConfirmationCode = useCallback(async () => {
    if (!pendingConfirmation) throw new Error("No pending confirmation");
    const rc: any = await cognito("ResendConfirmationCode", {
      ClientId: COGNITO_CLIENT_ID,
      Username: pendingConfirmation.email,
    });
    setPendingConfirmation({
      ...pendingConfirmation,
      destination: rc?.CodeDeliveryDetails?.Destination ?? pendingConfirmation.destination,
    });
  }, [pendingConfirmation]);

  const cancelConfirmation = useCallback(() => setPendingConfirmation(null), []);
  const signOut = useCallback(() => persist(null), [persist]);

  const value = useMemo<Ctx>(
    () => ({
      scope,
      session,
      loading,
      pendingConfirmation,
      signIn,
      signUp,
      confirmSignUp,
      resendConfirmationCode,
      cancelConfirmation,
      signOut,
    }),
    [scope, session, loading, pendingConfirmation, signIn, signUp, confirmSignUp, resendConfirmationCode, cancelConfirmation, signOut],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function usePulstractAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("usePulstractAuth must be used inside <PulstractAuthProvider>");
  return ctx;
}

export function useAccessToken(): string {
  const { session } = usePulstractAuth();
  if (!session) throw new Error("Not signed in");
  return session.accessToken;
}
