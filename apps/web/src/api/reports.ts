import http from '../lib/http';

export const reportsApi = {
  get: () => http.get('/reports'),
};
