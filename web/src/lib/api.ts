const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("nickname");
      window.location.href = "/login";
      throw new APIError(401, "认证已过期，请重新登录");
    }
    const body = await res.json().catch(() => ({ message: "请求失败" }));
    throw new APIError(res.status, body.message || "服务器错误");
  }

  return res.json();
}

// Auth
export const auth = {
  // Legacy
  register: (data: { nickname: string; birthDate: string; birthHour?: number; birthPlace?: string }) =>
    request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (id: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ id }),
    }),

  // Email
  emailRegister: (data: { email: string; password: string; nickname: string; birthDate: string; birthHour?: number; birthPlace?: string }) =>
    request<{ token: string; user: any }>("/auth/email/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  emailLogin: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>("/auth/email/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // OAuth
  googleLogin: (data: { idToken: string; nickname?: string; birthDate?: string; birthHour?: number }) =>
    request<{ token: string; user: any; needsProfile?: boolean; email?: string }>("/auth/oauth/google", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  appleLogin: (data: { idToken: string; nickname?: string; birthDate?: string; birthHour?: number }) =>
    request<{ token: string; user: any; needsProfile?: boolean; email?: string }>("/auth/oauth/apple", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Link password for OAuth users
  linkPassword: (data: { userId: string; password: string }) =>
    request<{ message: string }>("/auth/link-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Verification code (email)
  sendCode: (email: string) =>
    request<{ message: string }>("/auth/email/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyCode: (email: string, code: string) =>
    request<{ token?: string; user?: any; verified?: boolean; email?: string }>("/auth/email/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
  completeProfile: (data: { email: string; code: string; nickname: string; birthDate: string; birthHour?: number; birthPlace?: string }) =>
    request<{ token: string; user: any }>("/auth/email/complete-profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Daily Fortune
export const fortune = {
  daily: (userId: string) =>
    request<{
      overallScore: number;
      categories: { name: string; nameCn: string; score: number }[];
      generalAdvice: string;
      luckyColor: string;
      luckyNumber: number;
      luckyDirection: string;
      constellation: string;
      chineseZodiac: string;
      yi: string[];
      ji: string[];
      divineSign: {
        ganzhiDate: string;
        signPhrase: string;
        baseTone: string;
        userDayStem: string;
        interpretation: string;
        actionGuide: string;
        specificTimeGuide: string;
      } | null;
    }>(`/readings/daily-fortune/${userId}`),
};

// Readings
export const readings = {
  tarot: (data: { question: string; spreadId: string; userId: string }) =>
    request<{
      sessionId: string;
      cards: any[];
      interpretation: string;
      advice: string;
      score: number;
      spreadName: string;
      archivedId: string;
    }>("/readings/tarot", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  liuyao: (data: { question: string; lines: { value: 0 | 1; moving: boolean }[]; userId: string }) =>
    request<{
      sessionId: string;
      hexagram: any;
      interpretation: string;
      advice: string;
      score: number;
      archivedId: string;
    }>("/readings/liuyao", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  lingqian: (data: { question: string; stickNumber: number; userId: string }) =>
    request<{
      sessionId: string;
      stick: any;
      poem: string;
      interpretation: string;
      advice: string;
      score: number;
      archivedId: string;
    }>("/readings/lingqian", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// AI Chat
export const chat = {
  send: (data: { message: string; userId: string; contextId?: string; divinationContext?: string }) =>
    request<{ reply: string; contextId: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  history: (userId: string) =>
    request<{ messages: { role: "user" | "assistant"; content: string }[]; contextId: string | null }>(`/ai/chat/history/${userId}`),
};

// Archive (divination history)
export const archive = {
  list: (userId: string, page: number = 1) =>
    request<{ items: any[]; total: number; page: number; pageSize: number; hasMore: boolean }>(`/archive/${userId}?page=${page}&pageSize=20`),
  detail: (id: string) =>
    request<any>(`/archive/entry/${id}`),
};

// User
export const user = {
  profile: (id: string) =>
    request<any>(`/user/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/user/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Fate Book
export const fateBook = {
  get: (userId: string) =>
    request<any>(`/fate-book/${userId}`),
  generate: (userId: string) =>
    request<any>("/fate-book/generate", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};

// Zi Wei Dou Shu
export const zwds = {
  get: (userId: string) =>
    request<any>(`/zwds/${userId}`),
  generate: (userId: string) =>
    request<any>("/zwds/generate", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};
