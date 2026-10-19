"use client";

import { Loader2, Mic } from "lucide-react";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api-client";
import { hardNavigate } from "@/lib/navigation";
import { DemoChooser, type DemoData } from "./DemoChooser";

type Mode = "login" | "signup";
type Busy = null | "form" | DemoData;

const STEPS = [
  { title: "Speak your day", body: "Hold your Wispr Flow key and ramble — Hinglish welcome." },
  { title: "Get a clean log", body: "Done, in progress, blockers and tomorrow, checked against your GitHub commits." },
  { title: "Ship the update", body: "Standup, weekly report and brag doc in one click." },
];

export function LoginView() {
  const ids = { name: useId(), email: useId(), password: useId(), error: useId() };
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function enter(action: () => Promise<unknown>, kind: Exclude<Busy, null>) {
    setBusy(kind);
    setError(null);
    try {
      await action();
      // Full navigation so every client cache starts fresh for this user.
      hardNavigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = mode === "login" ? { email: form.email, password: form.password } : form;
    void enter(() => api.post(`/api/auth/${mode}`, body), "form");
  }

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="relative">
          <div aria-hidden="true" className="hero-gradient pointer-events-none absolute -inset-10 -z-10 blur-3xl" />
          <p className="eyebrow flex items-center gap-2">
            <Mic className="size-3.5" aria-hidden="true" /> Voice-first work journal
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Talk about your day.
            <br />
            Ship your standup.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            ShipLog turns a 30-second spoken ramble into a structured log, cross-checks it with your GitHub, and writes
            your standup, weekly report and appraisal brag doc.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="surface p-4">
                <p className="font-mono text-xs text-muted-foreground">0{i + 1}</p>
                <p className="mt-1 font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="auth-title" className="surface p-6 shadow-sm sm:p-8">
          <h2 id="auth-title" className="text-xl font-semibold tracking-tight">
            {mode === "login" ? "Log in to ShipLog" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Judges and first-timers: try the demo — with mock data or a fresh account, no sign-up needed.
          </p>

          <DemoChooser
            busy={busy === "mock" || busy === "empty" ? busy : null}
            disabled={busy === "form"}
            onPick={(data) => void enter(() => api.post("/api/auth/demo", { data }), data)}
          />

          <div className="my-6 flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
            aria-describedby={error ? ids.error : undefined}
            noValidate
          >
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ids.name}>Name</Label>
                <Input
                  id={ids.name}
                  value={form.name}
                  onChange={update("name")}
                  autoComplete="name"
                  required
                  maxLength={80}
                  className="h-10"
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.email}>Email</Label>
              <Input
                id={ids.email}
                type="email"
                value={form.email}
                onChange={update("email")}
                autoComplete="email"
                required
                inputMode="email"
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.password}>Password</Label>
              <Input
                id={ids.password}
                type="password"
                value={form.password}
                onChange={update("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                className="h-10"
              />
            </div>
            {error && (
              <p
                id={ids.error}
                role="alert"
                className="rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" variant="outline" disabled={busy !== null} className="h-10">
              {busy === "form" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="mt-4 min-h-10 text-sm text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </section>
      </main>
    </div>
  );
}
