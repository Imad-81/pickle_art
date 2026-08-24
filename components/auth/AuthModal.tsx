"use client";

import React, { useState } from "react";
import { useAuth, DEMO_PERSONAS } from "@/components/providers/AuthProvider";
import { signIn, signUp } from "@/lib/auth-client";
import { X, Sparkles, LogIn, ArrowRight, UserCheck } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, switchPersona, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
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
      } else {
        await signUp.email({ email, password, name: name || email.split("@")[0] });
      }
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Try demo login below.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#EDE6DD] overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#A3E635]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#386641]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-[#9E978E] hover:text-[#EDE6DD] hover:bg-[#2A2521] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A3E635] to-[#4D7C0F] text-[#171512] font-serif text-2xl font-bold shadow-lg mb-3">
            p.
          </div>
          <h2 className="text-2xl font-serif font-medium tracking-tight">
            Welcome to Pickle
          </h2>
          <p className="text-sm text-[#9E978E] mt-1 font-sans">
            A space to share process, connect and grow together.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#2A2521] hover:bg-[#342E29] border border-[#3E3832] rounded-xl text-sm font-medium transition-all shadow-sm active:scale-[0.99]"
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

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2E2924]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1C1A17] px-3 text-[#7E776F] font-mono">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-mono text-[#9E978E] mb-1">
                FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarohi Sen"
                className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creator@pickle.art"
              required
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-xs text-[#9E978E] hover:text-[#EDE6DD] transition-colors"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Demo Persona Switcher (For immediate testing) */}
        <div className="mt-6 pt-4 border-t border-[#2E2924]">
          <div className="flex items-center gap-1.5 text-xs text-[#A3E635] font-mono mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INSTANT TEST PERSONAS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_PERSONAS.map((p) => {
              const isCurrent = user?.username === p.username;
              return (
                <button
                  key={p.username}
                  onClick={() => {
                    switchPersona(p.username);
                    closeAuthModal();
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                    isCurrent
                      ? "bg-[#2A2521] border-[#A3E635] text-[#EDE6DD]"
                      : "bg-[#141210] border-[#26221E] text-[#9E978E] hover:text-[#EDE6DD] hover:bg-[#1E1B18]"
                  }`}
                >
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#3E3832]"
                  />
                  <div className="truncate">
                    <div className="text-xs font-medium truncate flex items-center gap-1">
                      {p.name}
                      {isCurrent && <UserCheck className="w-3 h-3 text-[#A3E635]" />}
                    </div>
                    <div className="text-[10px] text-[#7E776F] font-mono">
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
