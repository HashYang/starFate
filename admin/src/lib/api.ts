const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "请求失败" }));
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("admin_token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new APIError(res.status, body.message || "服务器错误");
  }

  return res.json();
}

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; admin: { id: string; nickname: string; email: string; role: string } }>(
      "/admin/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  me: () =>
    request<{ admin: { id: string; nickname: string; email: string; role: string; createdAt: string } }>(
      "/admin/auth/me"
    ),

  // Users
  users: (params: Record<string, string | number | boolean | undefined>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return request<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
      `/admin/users${qs ? `?${qs}` : ""}`
    );
  },
  userDetail: (id: string) => request<any>(`/admin/users/${id}`),
  userUpdate: (id: string, data: any) =>
    request<any>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  userDelete: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" }),
  userRestore: (id: string) =>
    request<any>(`/admin/users/${id}/restore`, { method: "POST" }),

  // Fortunes
  fortunes: (params: Record<string, string | number | undefined>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return request<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
      `/admin/fortunes${qs ? `?${qs}` : ""}`
    );
  },
  fortuneDetail: (id: string) => request<any>(`/admin/fortunes/${id}`),
  fortuneDelete: (id: string) =>
    request<{ message: string }>(`/admin/fortunes/${id}`, { method: "DELETE" }),

  // Archives
  archives: (params: Record<string, string | number | undefined>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return request<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
      `/admin/archives${qs ? `?${qs}` : ""}`
    );
  },
  archiveDetail: (id: string) => request<any>(`/admin/archives/${id}`),
  archiveDelete: (id: string) =>
    request<{ message: string }>(`/admin/archives/${id}`, { method: "DELETE" }),

  // Chat Contexts
  chatContexts: (params: Record<string, string | number | undefined>) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return request<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
      `/admin/chat-contexts${qs ? `?${qs}` : ""}`
    );
  },
  chatContextDetail: (id: string) => request<any>(`/admin/chat-contexts/${id}`),
  chatContextDelete: (contextId: string) =>
    request<{ message: string }>(`/admin/chat-contexts/${contextId}`, { method: "DELETE" }),

  // Dashboard
  dashboardStats: () => request<any>("/admin/dashboard/stats"),
  userGrowth: (days = 30) => request<{ date: string; count: number }[]>(`/admin/dashboard/user-growth?days=${days}`),
  readingTrend: (days = 30) =>
    request<{ date: string; tarot: number; fortune: number }[]>(`/admin/dashboard/reading-trend?days=${days}`),
};
