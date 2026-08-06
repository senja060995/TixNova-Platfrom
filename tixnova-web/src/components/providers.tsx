"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "./CartProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";
import { LocaleProvider } from "./LocaleProvider";

export function Providers({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <CartProvider>
          {children}
          <ToastContainer />
        </CartProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}