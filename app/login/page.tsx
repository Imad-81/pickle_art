"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, DEMO_PERSONAS } from "@/components/providers/AuthProvider";
import { signIn, signUp } from "@/lib/auth-client";
import { Sparkles, ArrowRight, UserCheck, ShieldCheck, Mail, Lock, User, Compass } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const { switchPersona, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/onboarding",
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google. You can use instant demo login below.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      setError(null);

      if (mode === "login") {
        await signIn.email({ email, password });
        router.push("/");
      } else {
        await signUp.email({ email, password, name: name || email.split("@")[0] });
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Authentication notice: Try instant demo test personas below.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (username: string) => {
    switchPersona(username);
    router.push("/");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 sm:w-[500px] h-96 bg-gradient-to-tr from-[#A3E635]/15 via-[#386641]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-[#1C1A17] border border-[#2E2924] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in relative overflow-hidden">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A3E635] to-[#4D7C0F] text-[#171512] font-serif text-2xl font-bold flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              p.
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5EFEB] tracking-tight">
            {mode === "login" ? "Welcome to Pickle" : "Join the Studio"}
          </h1>
          <p className="text-xs font-sans text-[#9E978E]">
            {mode === "login"
              ? "Sign in to document your craft and give constructive crits."
              : "Create an account to start sharing your 3-stage process trails."}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#241F1B] hover:bg-[#2D2722] border border-[#3A342D] rounded-xl text-xs font-semibold text-[#EDE6DD] transition-all shadow-sm active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2E2924]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#1C1A17] px-3 text-[#736B62] font-mono">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-mono text-[#9E978E] mb-1">
                FULL NAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7E776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarohi Sen"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-xl text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-[#9E978E] mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7E776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@pickle.art"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-xl text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#9E978E] mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7E776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-xl text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs font-sans rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            <span>{mode === "login" ? "Sign In to Studio" : "Create Studio Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-xs text-[#9E978E] hover:text-[#EDE6DD] transition-colors"
          >
            {mode === "login"
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Demo Persona Switcher */}
        <div className="pt-4 border-t border-[#2E2924] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-[#A3E635]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INSTANT TEST LOGIN</span>
            </div>
            <span className="text-[10px] text-[#736B62]">1-Click Demo</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_PERSONAS.map((p) => {
              const isCurrent = user?.username === p.username;
              return (
                <button
                  key={p.username}
                  onClick={() => handleSelectPersona(p.username)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                    isCurrent
                      ? "bg-[#241F1B] border-[#A3E635] text-[#EDE6DD]"
                      : "bg-[#141210] border-[#2E2924] text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#1E1B18]"
                  }`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#3E3832]"
                  />
                  <div className="truncate min-w-0">
                    <div className="text-xs font-medium truncate flex items-center gap-1">
                      {p.name}
                      {isCurrent && <UserCheck className="w-3 h-3 text-[#A3E635]" />}
                    </div>
                    <div className="text-[10px] text-[#736B62] font-mono truncate">
                      @{p.username}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#8A837A]">Loading Studio Login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
