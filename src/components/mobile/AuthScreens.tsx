import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { usePulstractAuth } from "@/lib/pulstract/auth";

/**
 * Renders sign-in / register UI intended to sit inside a PhoneFrame.
 * The parent must render <PhoneStatusBar /> above.
 */
export function AuthScreens() {
  const { signIn, signUp, loading } = usePulstractAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signin") {
        await signIn(email.trim());
      } else {
        await signUp(email.trim(), name.trim() || email.split("@")[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

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
            : "Sign up in seconds — dev accounts are auto-confirmed."}
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

      <p className="text-xs text-muted-foreground mt-4">
        Dev backend uses passwordless CUSTOM_AUTH — no password required.
      </p>

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
