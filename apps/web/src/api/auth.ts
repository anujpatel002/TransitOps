import http from '../lib/http';

export const authApi = {
  login: (email: string, password: string) =>
    http.post<{ token: string; user: { id: string; email: string; role: string } }>('/auth/login', { email, password }),
};
