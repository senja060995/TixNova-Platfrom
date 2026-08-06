import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Ticket } from "@/types";

interface CartItem {
  ticket: Ticket;
  quantity: number;
  attendees: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
}

interface CartState {
  items: CartItem[];
  eventId: number | null;
  addItem: (ticket: Ticket, quantity: number) => void;
  removeItem: (ticketId: number) => void;
  updateQuantity: (ticketId: number, quantity: number) => void;
  updateAttendees: (ticketId: number, attendees: CartItem["attendees"]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  setEventId: (eventId: number | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      eventId: null,

      addItem: (ticket: Ticket, quantity: number) => {
        const { items, eventId } = get();
        
        if (eventId && eventId !== ticket.event_id) {
          return;
        }

        const existingIndex = items.findIndex((item) => item.ticket.id === ticket.id);
        
        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({
            items: [
              ...items,
              {
                ticket,
                quantity,
                attendees: Array.from({ length: quantity }, () => ({
                  name: "",
                  email: "",
                  phone: "",
                })),
              },
            ],
            eventId: ticket.event_id,
          });
        }
      },

      removeItem: (ticketId: number) => {
        const { items } = get();
        const newItems = items.filter((item) => item.ticket.id !== ticketId);
        set({ 
          items: newItems,
          eventId: newItems.length > 0 ? newItems[0].ticket.event_id : null,
        });
      },

      updateQuantity: (ticketId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(ticketId);
          return;
        }

        const { items } = get();
        const newItems = items.map((item) =>
          item.ticket.id === ticketId
            ? {
                ...item,
                quantity,
                attendees: Array.from({ length: quantity }, (_, i) => 
                  item.attendees[i] || { name: "", email: "", phone: "" }
                ),
              }
            : item
        );
        set({ items: newItems });
      },

      updateAttendees: (ticketId: number, attendees: CartItem["attendees"]) => {
        const { items } = get();
        const newItems = items.map((item) =>
          item.ticket.id === ticketId ? { ...item, attendees } : item
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({ items: [], eventId: null });
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.ticket.price * item.quantity, 0);
      },

      setEventId: (eventId: number | null) => {
        set({ eventId });
      },
    }),
    {
      name: "cart-storage",
    }
  )
);