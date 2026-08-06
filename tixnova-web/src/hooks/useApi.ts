import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Event, PaginatedResponse, Blog, Category } from "@/types";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (slug: string) => [...eventKeys.details(), slug] as const,
  featured: () => [...eventKeys.all, "featured"] as const,
  cities: () => [...eventKeys.all, "cities"] as const,
};

export const blogKeys = {
  all: ["blogs"] as const,
  lists: () => [...blogKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) => [...blogKeys.lists(), params] as const,
  details: () => [...blogKeys.all, "detail"] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
  categories: () => [...blogKeys.all, "categories"] as const,
};

export function useEvents(params?: {
  page?: number;
  per_page?: number;
  city?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  price_min?: number;
  price_max?: number;
  sort?: string;
}) {
  return useQuery({
    queryKey: eventKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.getClient().get<PaginatedResponse<Event>>("/events", { params });
      return response.data;
    },
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: eventKeys.detail(slug),
    queryFn: async () => {
      const response = await api.getClient().get<{ success: boolean; data: Event }>(`/events/${slug}`);
      return response.data.data;
    },
    enabled: !!slug,
  });
}

export function useFeaturedEvents(limit = 6) {
  return useQuery({
    queryKey: eventKeys.featured(),
    queryFn: async () => {
      const response = await api.getClient().get<{ success: boolean; data: Event[] }>("/events/featured", {
        params: { limit },
      });
      return response.data.data;
    },
  });
}

export function useCities() {
  return useQuery({
    queryKey: eventKeys.cities(),
    queryFn: async () => {
      const response = await api.getClient().get<{ success: boolean; data: string[] }>("/events/cities");
      return response.data.data;
    },
  });
}

export function useBlogs(params?: {
  page?: number;
  per_page?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  tenant_id?: number;
}) {
  return useQuery({
    queryKey: blogKeys.list(params || {}),
    queryFn: async () => {
      const response = await api.getClient().get<PaginatedResponse<Blog>>("/blogs", { params });
      return response.data;
    },
  });
}

export function useBlog(slug: string) {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: async () => {
      const response = await api.getClient().get<{ success: boolean; data: Blog }>(`/blogs/${slug}`);
      return response.data.data;
    },
    enabled: !!slug,
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: async () => {
      const response = await api.getClient().get<{ success: boolean; data: Category[] }>("/blogs/categories/list");
      return response.data.data;
    },
  });
}