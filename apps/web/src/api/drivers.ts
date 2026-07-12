import http from '../lib/http';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
}

export const driversApi = {
  list: () => http.get<Driver[]>('/drivers'),
  available: () => http.get<Driver[]>('/drivers/available'),
  get: (id: string) => http.get<Driver>(`/drivers/${id}`),
  create: (data: Omit<Driver, 'id'>) => http.post<Driver>('/drivers', data),
  update: (id: string, data: Partial<Driver>) => http.put<Driver>(`/drivers/${id}`, data),
  remove: (id: string) => http.delete(`/drivers/${id}`),
};
