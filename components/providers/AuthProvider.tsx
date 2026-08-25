"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession, signOut as betterSignOut } from "@/lib/auth-client";

export interface PickleUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  disciplines?: string[];
  growthPoints?: number;
}

export const DEMO_PERSONAS: PickleUser[] = [
  {
    id: "aarohisen",
    email: "aarohi@pickle.art",
    name: "Aarohi Sen",
    username: "aarohisen",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
    bio: "Designer & Illustrator exploring stories through form, texture, and tactile emotion.",
    disciplines: ["#illustration", "#packaging", "#typography"],
    growthPoints: 480,
  },
  {
    id: "devp",
    email: "dev@pickle.art",
    name: "Dev Patel",
    username: "devp",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    bio: "Exploring unboxing ergonomics and sustainable kraft structures.",
    disciplines: ["#packaging", "#industrial"],
    growthPoints: 620,
  },
  {
    id: "meerak",
    email: "meera@pickle.art",
    name: "Meera K.",
    username: "meerak",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop",
    bio: "Character studies, anatomical sketches & mythical creature world-building.",
    disciplines: ["#illustration", "#concept-art"],
    growthPoints: 540,
  },
  {
    id: "aaravs",
    email: "aarav@pickle.art",
    name: "Aarav S.",
    username: "aaravs",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
    bio: "Timber joinery, low-poly seating, and physical mockups.",
    disciplines: ["#industrial", "#furniture", "#architecture"],
    growthPoints: 710,
  },
];

interface AuthContextType {
  user: PickleUser | null;
  convexUser: any;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  switchPersona: (username: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [activePersona, setActivePersona] = useState<PickleUser | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const syncConvexUser = useMutation(api.users.syncUser);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pickle_active_user");
    if (saved) {
      if (saved === "guest") {
        setActivePersona(null);
        return;
      }
      try {
        const parsed = JSON.parse(saved);
        setActivePersona(parsed);
        return;
      } catch {}
    }
    // Default to Aarohi Sen for instant demo experience
    setActivePersona(DEMO_PERSONAS[0]);
    localStorage.setItem("pickle_active_user", JSON.stringify(DEMO_PERSONAS[0]));
  }, []);

  // Sync session user if Better Auth session exists
  useEffect(() => {
    if (session?.user?.email) {
      const u: PickleUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || "Pickle Creator",
        username: session.user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_"),
        avatarUrl: session.user.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${session.user.email}`,
      };
      setActivePersona(u);
      localStorage.setItem("pickle_active_user", JSON.stringify(u));

      // Sync to Convex
      syncConvexUser({
        email: u.email,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl,
      }).catch(console.error);
    }
  }, [session, syncConvexUser]);

  const userEmail = activePersona?.email || "aarohi@pickle.art";
  const convexUser = useQuery(
    api.users.getByEmail,
    activePersona ? { email: userEmail } : "skip"
  );

  const switchPersona = (username: string) => {
    const target = DEMO_PERSONAS.find((p) => p.username === username);
    if (target) {
      setActivePersona(target);
      localStorage.setItem("pickle_active_user", JSON.stringify(target));
      syncConvexUser({
        email: target.email,
        name: target.name,
        username: target.username,
        avatarUrl: target.avatarUrl,
        bio: target.bio,
        disciplines: target.disciplines,
      }).catch(console.error);
    }
  };

  const logout = async () => {
    try {
      await betterSignOut();
    } catch {}
    localStorage.setItem("pickle_active_user", "guest");
    setActivePersona(null);
  };

  const currentUser: PickleUser | null = activePersona
    ? {
        ...activePersona,
        id: convexUser?._id || activePersona.id,
        growthPoints: convexUser?.growthPoints ?? activePersona.growthPoints ?? 50,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        convexUser,
        isLoading: isSessionLoading,
        isAuthModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        switchPersona,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
