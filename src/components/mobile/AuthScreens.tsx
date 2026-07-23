import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, MailCheck } from "lucide-react";
import { usePulstractAuth } from "@/lib/pulstract/auth";

export function AuthScreens() {
  const {
    signIn,
    signUp,
    loading,
    pendingConfirmation,
    confirmSignUp,
    resendConfirmationCode,
    cancelConfirmation,
  } = usePulstractAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password ? password : undefined);
      } else {
        await signUp(email.trim(), name.trim() || email.split("@")[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await confirmSignUp(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendConfirmationCode();
      setInfo("A new code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    }
  };

  // ---------- Confirmation code screen ----------
  if (pendingConfirmation) {
    return (
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 bg-background flex flex-col">
        <div className="mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-hero mb-4 flex items-center justify-center text-primary-foreground shadow-elegant">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Confirm your email</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a verification code to{" "}
            <span className="font-medium text-foreground">
              {pendingConfirmation.destination || pendingConfirmation.email}
            </span>
            . Enter it below to activate your account.
          </p>
        </div>

        <form onSubmit={submitCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-xs">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, ""))}
              placeholder="123456"
              className="tracking-[0.4em] text-center text-lg"
              maxLength={10}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && !error && (
            <div className="text-xs text-muted-foreground bg-muted/60 rounded-md p-2">{info}</div>
          )}

          <Button type="submit" disabled={loading || code.length < 4} className="w-full bg-gradient-hero shadow-elegant">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</>
            ) : (
              "Verify & continue"
            )}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button type="button" onClick={resend} className="text-primary font-semibold" disabled={loading}>
            Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              cancelConfirmation();
              setCode("");
              setError(null);
              setInfo(null);
            }}
            className="text-muted-foreground"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // ---------- Sign in / Sign up ----------
  return (
    <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 bg-background flex flex-col">
      <div className="mb-6">
        <div className="h-14 w-14 rounded-2xl bg-gradient-hero mb-4 flex items-center justify-center text-primary-foreground font-display text-xl font-bold shadow-elegant">
          P
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signin"
            ? "Sign in to book classes and manage your gym."
            : "We'll email you a verification code to activate your account."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@pulstract.dev"
            autoComplete="email"
          />
        </div>
        {mode === "signin" && (
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Password <span className="text-muted-foreground">(optional for passwordless)</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank for magic-link style"
              autoComplete="current-password"
            />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-gradient-hero shadow-elegant"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === "signin" ? "Signing in…" : "Creating account…"}
            </>
          ) : (
            mode === "signin" ? "Sign in" : "Create account"
          )}
        </Button>
      </form>

      <div className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="text-primary font-semibold"
        >
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
