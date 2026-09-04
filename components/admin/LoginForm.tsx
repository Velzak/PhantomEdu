"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

function sameOriginAdminCallback(raw: string | null) {
  const origin = window.location.origin;
  const fallback = `${origin}/admin`;
  if (!raw) return fallback;
  try {
    const url = raw.startsWith("http://") || raw.startsWith("https://") ? new URL(raw) : new URL(raw, origin);
    if (url.origin !== origin) return fallback;
    if (!url.pathname.startsWith("/admin")) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const callbackUrl = sameOriginAdminCallback(params.get("callbackUrl"));
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (!result || result.error) {
        setError("Email or password did not match, or too many attempts. Wait and try again.");
        return;
      }
      window.location.href = result.url || callbackUrl;
    } catch {
      setError("Sign-in failed. Check the email and password, then try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl bg-surface p-6 shadow-lift">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="text"
          inputMode="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="mt-5 w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
