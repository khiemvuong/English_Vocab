"use client";

import { speakWord } from "@/utils/audio";

interface AudioButtonProps {
  text: string;
  className?: string;
  iconClassName?: string;
}

export function AudioButton({
  text,
  className = "ml-1.5 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors active:scale-95",
  iconClassName = "w-3.5 h-3.5"
}: AudioButtonProps) {
  if (!text) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        speakWord(text);
      }}
      className={className}
      title={`Listen to ${text}`}
    >
      <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
      </svg>
    </button>
  );
}
