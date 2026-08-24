"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Home, Mail, Plus, Compass, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isHome = pathname === "/";
  const isMessages = pathname.startsWith("/messages");
  const isCreate = pathname.startsWith("/project/create");
  const isDiscover = pathname.startsWith("/discover");
  const isProfile = pathname.startsWith("/profile");

  const profileHref = user ? `/profile/${user.username}` : "/profile/aarohisen";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#171512]/95 backdrop-blur-md border-t border-[#2E2924] px-4 py-2 flex items-center justify-around max-w-lg mx-auto sm:max-w-none">
      {/* 1. Home / Feed */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
          isHome ? "text-[#E08B3F]" : "text-[#8A837A] hover:text-[#EDE6DD]"
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[10px] font-sans font-medium">Feed</span>
      </Link>

      {/* 2. Messages & Feedback Notes */}
      <Link
        href="/messages"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
          isMessages ? "text-[#E08B3F]" : "text-[#8A837A] hover:text-[#EDE6DD]"
        }`}
      >
        <Mail className={`w-5 h-5 ${isMessages ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[10px] font-sans font-medium">Notes & DMs</span>
      </Link>

      {/* 3. Create Action (+) Button */}
      <Link
        href="/project/create"
        className="relative -top-3 p-3.5 rounded-full bg-gradient-to-br from-[#E08B3F] to-[#CA782F] text-[#171512] shadow-lg shadow-[#E08B3F]/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-[#171512]"
      >
        <Plus className="w-6 h-6 stroke-[2.75]" />
      </Link>

      {/* 4. Discover & Search */}
      <Link
        href="/discover"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
          isDiscover ? "text-[#E08B3F]" : "text-[#8A837A] hover:text-[#EDE6DD]"
        }`}
      >
        <Compass className={`w-5 h-5 ${isDiscover ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="text-[10px] font-sans font-medium">Discover</span>
      </Link>

      {/* 5. Profile & Growth Trail */}
      <Link
        href={profileHref}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
          isProfile ? "text-[#E08B3F]" : "text-[#8A837A] hover:text-[#EDE6DD]"
        }`}
      >
        {user ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className={`w-5 h-5 rounded-full object-cover border ${
              isProfile ? "border-[#E08B3F]" : "border-transparent"
            }`}
          />
        ) : (
          <User className={`w-5 h-5 ${isProfile ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        )}
        <span className="text-[10px] font-sans font-medium">Profile</span>
      </Link>
    </nav>
  );
}
