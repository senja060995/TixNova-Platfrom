import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface CartItem {
  ticket_id: number;
  quantity: number;
  attendees: Array<{
    name: string;
    email: string;
    phone: string;
  }>;
}

interface CartState {
  items: CartItem[];
  eventId: number | null;
  addItem: (item: CartItem) => void;
  updateQuantity: (ticketId: number, quantity: number) => void;
  removeItem: (ticketId: number) => void;
  clearCart: () => void;
  setEventId: (eventId: number) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      eventId: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.ticket_id === item.ticket_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.ticket_id === item.ticket_id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      updateQuantity: (ticketId, quantity) =>
        set((state) => ({
          items: quantity > 0
            ? state.items.map((i) => (i.ticket_id === ticketId ? { ...i, quantity } : i))
            : state.items.filter((i) => i.ticket_id !== ticketId),
        })),
      removeItem: (ticketId) =>
        set((state) => ({
          items: state.items.filter((i) => i.ticket_id !== ticketId),
        })),
      clearCart: () => set({ items: [], eventId: null }),
      setEventId: (eventId) => set({ eventId }),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.quantity * 0, 0),
    }),
    {
      name: "cart-storage",
    }
  )
);

interface NotifState {
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  toasts: [],
  addToast: (message, type) =>
    set((state) => {
      // Use a combination of timestamp and random number to reduce collision chances
      // While still avoiding hydration issues by checking window availability
      const id = typeof window !== 'undefined' 
        ? Date.now().toString() + Math.random().toString(36).substring(2, 9) 
        : 'server-toast-' + Math.random().toString(36).substring(2, 9);
      return {
        toasts: [...state.toasts, { id, message, type }],
      };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));