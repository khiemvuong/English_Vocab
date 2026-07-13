import { create } from "zustand";
import { persist } from "zustand/middleware";

import { readLegacyQuizStorageState } from "@/lib/progressPersistence";

interface AudioStore {
  isMuted: boolean;
  toggleMute: () => void;
}

function getLegacyIsMuted() {
  const legacyState = readLegacyQuizStorageState();
  return typeof legacyState?.isMuted === "boolean" ? legacyState.isMuted : false;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      isMuted: getLegacyIsMuted(),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    }),
    {
      name: "toeic-audio-storage",
    }
  )
);
