import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
  }> = [];

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => this.client(originalRequest));
          }

          this.isRefreshing = true;

          try {
            const response = await axios.post(
              `${this.client.defaults.baseURL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${this.refreshToken}`,
                },
              }
            );

            const { access_token, refresh_token } = response.data.data;
            this.setAccessToken(access_token);
            this.setRefreshToken(refresh_token);

            this.failedQueue.forEach(({ resolve }) => resolve(true));
            this.failedQueue = [];

            return this.client(originalRequest);
          } catch {
            this.failedQueue.forEach(({ reject }) => reject(new Error("Token refresh failed")));
            this.failedQueue = [];
            this.clearTokens();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", token);
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== "undefined") {
      this.refreshToken = localStorage.getItem("refresh_token");
    }
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const api = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 30000,
});

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.getClient().post("/auth/login", { email, password });
    return response.data;
  },

  register: async (data: { name: string; email: string; password: string; password_confirmation: string; phone?: string; referral_code?: string }) => {
    const response = await api.getClient().post("/auth/register", data);
    return response.data;
  },

  registerPromotor: async (data: { name: string; email: string; password: string; password_confirmation: string; tenant_name: string; tenant_email: string; tenant_phone?: string; organization_name?: string; phone?: string }) => {
    const payload = {
      ...data,
      organization_name: data.organization_name || data.tenant_name,
      phone: data.phone || data.tenant_phone,
    };
    const response = await api.getClient().post("/auth/register/promotor", payload);
    return response.data;
  },

  logout: async () => {
    const response = await api.getClient().post("/auth/logout");
    api.clearTokens();
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.getClient().post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string, password_confirmation: string) => {
    const response = await api.getClient().post("/auth/reset-password", { token, password, password_confirmation });
    return response.data;
  },

  getMe: async () => {
    const response = await api.getClient().get("/auth/me");
    return response.data;
  },

  refresh: async () => {
    const response = await api.getClient().post("/auth/refresh");
    return response.data;
  },

  getClient: () => api.getClient(),
  setAccessToken: (token: string) => api.setAccessToken(token),
  setRefreshToken: (token: string) => api.setRefreshToken(token),
  getAccessToken: () => api.getAccessToken(),
  getRefreshToken: () => api.getRefreshToken(),
  clearTokens: () => api.clearTokens(),
};

export const publicApi = {
  events: {
    list: (params?: Record<string, unknown>) => api.getClient().get("/events", { params }),
    show: (slug: string, params?: Record<string, unknown>) => api.getClient().get(`/events/${slug}`, { params }),
    seatMap: (slug: string) => api.getClient().get(`/events/${slug}/seat-map`),
    featured: (limit = 6) => api.getClient().get("/events/featured", { params: { limit } }),
    cities: () => api.getClient().get("/events/cities"),
    categories: () => api.getClient().get("/categories"),
  },

  blogs: {
    list: (params?: Record<string, unknown>) => api.getClient().get("/blogs", { params }),
    show: (slug: string, params?: Record<string, unknown>) => api.getClient().get(`/blogs/${slug}`, { params }),
    categories: () => api.getClient().get("/blogs/categories/list"),
  },

  communities: {
    list: (params?: Record<string, unknown>) => api.getClient().get("/communities", { params }),
    show: (slug: string) => api.getClient().get(`/communities/${slug}`),
    join: (slug: string) => api.getClient().post(`/communities/${slug}/join`),
    leave: (slug: string) => api.getClient().post(`/communities/${slug}/leave`),
    summary: (slug: string) => api.getClient().get(`/promotor/communities/${slug}/summary`),
  },
};