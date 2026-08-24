"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";

export function LeaveChannelModal({
  isOpen,
  channelName,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  channelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#1C1A17] border border-[#3E292E] rounded-2xl shadow-2xl p-6 text-[#EDE6DD] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#C97B84]/20 border border-[#C97B84]/40 flex items-center justify-center text-[#C97B84] mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-serif font-bold text-[#EDE6DD]">
            Leave #{channelName}?
          </h3>
          <p className="text-xs text-[#8A837A] mt-1 font-sans">
            You will no longer receive real-time discussion updates or card attachments from this channel stream.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#241F1B] hover:bg-[#2F2923] text-xs font-medium rounded-xl text-[#EDE6DD] transition-colors"
          >
            Stay in Channel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#C97B84] hover:bg-[#B56A73] text-[#171512] font-semibold text-xs rounded-xl transition-colors shadow-md"
          >
            Leave Channel
          </button>
        </div>
      </div>
    </div>
  );
}
