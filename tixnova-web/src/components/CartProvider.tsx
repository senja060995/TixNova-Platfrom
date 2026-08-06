"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Ticket } from "@/types";

interface CartItem {
  ticket: Ticket;
  quantity: number;
  attendees: Array<{
    name: string;
    email: string;
    phone: string;
  }>;
}

interface CartContextType {
  items: CartItem[];
  eventId: number | null;
  addItem: (ticket: Ticket, quantity: number) => void;
  removeItem: (ticketId: number) => void;
  updateQuantity: (ticketId: number, quantity: number) => void;
  updateAttendees: (ticketId: number, attendees: CartItem["attendees"]) => void;
  clearCart: () => void;
  setEventId: (eventId: number | null) => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [eventId, setEventId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cart-storage");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed.items || []);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setEventId(parsed.eventId || null);
        } catch {
          localStorage.removeItem("cart-storage");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart-storage", JSON.stringify({ items, eventId }));
    }
  }, [items, eventId]);

  const addItem = (ticket: Ticket, quantity: number) => {
    if (eventId && eventId !== ticket.event_id) {
      return;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.ticket.id === ticket.id);
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += quantity;
        newItems[existingIndex].attendees = Array.from(
          { length: newItems[existingIndex].quantity },
          (_, i) => newItems[existingIndex].attendees[i] || { name: "", email: "", phone: "" }
        );
        return newItems;
      }

      return [
        ...prev,
        {
          ticket,
          quantity,
          attendees: Array.from({ length: quantity }, () => ({ name: "", email: "", phone: "" })),
        },
      ];
    });

    setEventId(ticket.event_id);
  };

  const removeItem = (ticketId: number) => {
    setItems((prev) => prev.filter((item) => item.ticket.id !== ticketId));
  };

  const updateQuantity = (ticketId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(ticketId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.ticket.id === ticketId
          ? {
              ...item,
              quantity,
              attendees: Array.from({ length: quantity }, (_, i) => 
                item.attendees[i] || { name: "", email: "", phone: "" }
              ),
            }
          : item
      )
    );
  };

  const updateAttendees = (ticketId: number, attendees: CartItem["attendees"]) => {
    setItems((prev) =>
      prev.map((item) =>
        item.ticket.id === ticketId ? { ...item, attendees } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setEventId(null);
  };

  const getTotalItems = () => items.reduce((sum, item) => sum + item.quantity, 0);

  const getSubtotal = () => items.reduce((sum, item) => sum + item.ticket.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        eventId,
        addItem,
        removeItem,
        updateQuantity,
        updateAttendees,
        clearCart,
        setEventId,
        getTotalItems,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}