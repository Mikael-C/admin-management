// API client for communicating with the Express backend
// Set NEXT_PUBLIC_API_URL in your .env.local file

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('estatepro_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}/api${path}`
    if (params) {
      const searchParams = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '') as [string, string][]
      )
      if (searchParams.toString()) url += `?${searchParams}`
    }

    const response = await fetch(url, {
      method,
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>('GET', path, undefined, params)
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>('POST', path, body)
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>('PUT', path, body)
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body)
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

export const api = new ApiClient(API_BASE_URL)

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: any; redirectTo: string }>('/auth/login', { email, password }),

  me: () => api.get<{ user: any }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
}

// ─── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get<any>('/dashboard'),
}

// ─── Landlords ───────────────────────────────────────────────
export const landlordsApi = {
  list: (params?: Record<string, string>) => api.get<any>('/landlords', params),
  get: (id: number) => api.get<any>(`/landlords/${id}`),
  stats: (id: number) => api.get<any>(`/landlords/${id}/stats`),
  create: (data: any) => api.post('/landlords', data),
  update: (id: number, data: any) => api.put(`/landlords/${id}`, data),
  delete: (id: number) => api.delete(`/landlords/${id}`),
}

// ─── Agents ──────────────────────────────────────────────────
export const agentsApi = {
  list: (params?: Record<string, string>) => api.get<any>('/agents', params),
  get: (id: number) => api.get<any>(`/agents/${id}`),
  stats: (id: number) => api.get<any>(`/agents/${id}/stats`),
  create: (data: any) => api.post('/agents', data),
  update: (id: number, data: any) => api.put(`/agents/${id}`, data),
  delete: (id: number) => api.delete(`/agents/${id}`),
}

// ─── Properties ──────────────────────────────────────────────
export const propertiesApi = {
  list: (params?: Record<string, string>) => api.get<any>('/properties', params),
  get: (id: number) => api.get<any>(`/properties/${id}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: number, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: number) => api.delete(`/properties/${id}`),
}

// ─── Tenants ─────────────────────────────────────────────────
export const tenantsApi = {
  list: (params?: Record<string, string>) => api.get<any>('/tenants', params),
  get: (id: number) => api.get<any>(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants', data),
  update: (id: number, data: any) => api.put(`/tenants/${id}`, data),
  patch: (id: number, data: any) => api.patch(`/tenants/${id}`, data),
  delete: (id: number) => api.delete(`/tenants/${id}`),
}

// ─── Rents ───────────────────────────────────────────────────
export const rentsApi = {
  list: (params?: Record<string, string>) => api.get<any>('/rents', params),
  get: (id: number) => api.get<any>(`/rents/${id}`),
  create: (data: any) => api.post('/rents', data),
  update: (id: number, data: any) => api.put(`/rents/${id}`, data),
  delete: (id: number) => api.delete(`/rents/${id}`),
}

// ─── Expenses ────────────────────────────────────────────────
export const expensesApi = {
  list: (params?: Record<string, string>) => api.get<any>('/expenses', params),
  get: (id: number) => api.get<any>(`/expenses/${id}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: number, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
}

// ─── Maintenance ─────────────────────────────────────────────
export const maintenanceApi = {
  list: (params?: Record<string, string>) => api.get<any>('/maintenance', params),
  get: (id: number) => api.get<any>(`/maintenance/${id}`),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: number, data: any) => api.put(`/maintenance/${id}`, data),
  patch: (id: number, data: any) => api.patch(`/maintenance/${id}`, data),
  delete: (id: number) => api.delete(`/maintenance/${id}`),
}

// ─── Messages ────────────────────────────────────────────────
export const messagesApi = {
  inbox: (params?: Record<string, string>) => api.get<any>('/messages', params),
  conversations: () => api.get<any>('/messages/conversations'),
  thread: (userId: number) => api.get<any>(`/messages/thread/${userId}`),
  contacts: () => api.get<any>('/messages/contacts'),
  send: (data: { receiverId: number; subject?: string; content: string; parentId?: number }) =>
    api.post('/messages', data),
  markRead: (id: number) => api.patch(`/messages/${id}/read`),
  delete: (id: number) => api.delete(`/messages/${id}`),
}

// ─── Payouts ─────────────────────────────────────────────────
export const payoutsApi = {
  list: (params?: Record<string, string>) => api.get<any>('/payouts', params),
  get: (id: number) => api.get<any>(`/payouts/${id}`),
  request: (data: any) => api.post('/payouts', data),
  approve: (id: number, adminNote?: string) => api.put(`/payouts/${id}/approve`, { adminNote }),
  disburse: (id: number, adminNote?: string) => api.put(`/payouts/${id}/disburse`, { adminNote }),
  reject: (id: number, adminNote?: string) => api.put(`/payouts/${id}/reject`, { adminNote }),
  delete: (id: number) => api.delete(`/payouts/${id}`),
}

// ─── Users ───────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, string>) => api.get<any>('/users', params),
  get: (id: number) => api.get<any>(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  toggleActive: (id: number) => api.patch(`/users/${id}/toggle-active`),
  delete: (id: number) => api.delete(`/users/${id}`),
}

// ─── Profile ─────────────────────────────────────────────────
export const profileApi = {
  me: () => api.get<any>('/profile'),
  get: (userId: number) => api.get<any>(`/profile/${userId}`),
  update: (data: any) => api.put('/profile', data),
}
