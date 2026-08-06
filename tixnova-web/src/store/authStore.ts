import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { authApi } from "@/lib/api";

interface RoleLike {
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const normalizeRole = (r: unknown): string => {
  if (typeof r === "object" && r !== null) {
    const roleObj = r as RoleLike;
    return roleObj.name || "";
  }
  return String(r || "");
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      login: (user: User, accessToken: string, refreshToken: string) => {
        authApi.setAccessToken(accessToken);
        authApi.setRefreshToken(refreshToken);
        const rawRoles = user.roles || [];
        const rolesList = (Array.isArray(rawRoles) ? rawRoles : [rawRoles])
          .map(normalizeRole)
          .filter(Boolean);
        const userObj = {
          ...user,
          roles: rolesList,
          role: rolesList[0] || normalizeRole((user as User & { role?: unknown }).role) || "user",
        };
        set({ user: userObj, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        authApi.clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      checkAuth: async () => {
        const token = authApi.getAccessToken();
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await authApi.getClient().get("/auth/me");
          if (response.data.success && response.data.data) {
            const rawData = response.data.data;
            const userData = rawData.user || rawData;
            const rawRoles = rawData.roles || userData.roles || [];
            const rolesList = (Array.isArray(rawRoles) ? rawRoles : [rawRoles])
              .map(normalizeRole)
              .filter(Boolean);
            const userObj = {
              ...userData,
              roles: rolesList,
              role: rolesList[0] || normalizeRole(userData.role) || "user",
            };
            set({ user: userObj, isAuthenticated: true, isLoading: false });
          } else {
            throw new Error("Invalid response");
          }
        } catch {
          authApi.clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);