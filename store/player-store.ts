
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ECONOMY } from '@/lib/economy';

export interface PlayerSettings {
  sound: boolean;
  reducedMotion: boolean;
}

export interface PlayerProfile {
  gems: number;
  createdAt: number; // Timestamp
  lastDailyClaim: string | null; // ISO Date string
  dailyStreak: number;
  settings: PlayerSettings;
  ageGateAccepted: boolean;
  schemaVersion: number;
}

interface PlayerState extends PlayerProfile {
  // Actions
  initProfile: () => void;
  acceptAgeGate: () => void;
  addGems: (amount: number) => void;
  deductGems: (amount: number) => boolean; // Returns false if insufficient funds
  claimDailyBonus: () => { success: boolean; message: string; amount: number };
  updateSettings: (settings: Partial<PlayerSettings>) => void;
  resetProfile: () => void;
}

const INITIAL_STATE: PlayerProfile = {
  gems: ECONOMY.INITIAL_GEMS,
  createdAt: Date.now(),
  lastDailyClaim: null,
  dailyStreak: 0,
  settings: {
    sound: true,
    reducedMotion: false,
  },
  ageGateAccepted: false,
  schemaVersion: 1,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      initProfile: () => {
        // If profile exists (handled by persist), do nothing?
        // Actually persist handles hydration.
        // This might be useful for migrations if we check state version.
        const state = get();
        if (!state.createdAt) {
          set({ ...INITIAL_STATE, createdAt: Date.now() });
        }
      },

      acceptAgeGate: () => set({ ageGateAccepted: true }),

      addGems: (amount: number) => set((state) => ({ gems: state.gems + amount })),

      deductGems: (amount: number) => {
        const currentGems = get().gems;
        if (currentGems < amount) return false;
        set({ gems: currentGems - amount });
        return true;
      },

      claimDailyBonus: () => {
        const state = get();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        if (state.lastDailyClaim === todayStr) {
          return { success: false, message: 'Already claimed today', amount: 0 };
        }

        // Check streak
        let streak = state.dailyStreak;
        if (state.lastDailyClaim) {
          const lastClaimDate = new Date(state.lastDailyClaim);
          const diffTime = Math.abs(now.getTime() - lastClaimDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          // If missed a day (diffDays > 1, assuming consecutive), reset streak?
          // Actually diffDays=1 means yesterday. diffDays=0 means today.
          // Let's be generous: if it's been more than 48 hours, reset.
          // Simplest: check if yesterday was the last claim.
          
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (state.lastDailyClaim === yesterdayStr) {
            streak++;
          } else {
            streak = 1; // Reset to 1 if streak broken
          }
        } else {
          streak = 1;
        }

        const streakBonus = Math.min(
          (streak - 1) * ECONOMY.DAILY_BONUS_STREAK_INCREMENT,
          ECONOMY.DAILY_BONUS_STREAK_CAP
        );
        const totalBonus = ECONOMY.DAILY_BONUS_BASE + streakBonus;

        set((state) => ({
          gems: state.gems + totalBonus,
          lastDailyClaim: todayStr,
          dailyStreak: streak,
        }));

        return { success: true, message: `Claimed ${totalBonus} Gems!`, amount: totalBonus };
      },

      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      resetProfile: () => set({ ...INITIAL_STATE, ageGateAccepted: true }), // Keep age gate? Or reset all? User choice. Let's keep age gate for convenience.
    }),
    {
      name: 'gem-casino-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // migration logic if needed
        }
        return persistedState as PlayerState;
      },
    }
  )
);
