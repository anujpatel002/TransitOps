import http from '../lib/http';

export const dashboardApi = {
  get: () => http.get('/dashboard'),
};
