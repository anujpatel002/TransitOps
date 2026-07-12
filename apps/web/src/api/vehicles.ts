import http from '../lib/http';

export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
}

export const vehiclesApi = {
  list: () => http.get<Vehicle[]>('/vehicles'),
  get: (id: string) => http.get<Vehicle>(`/vehicles/${id}`),
  create: (data: Omit<Vehicle, 'id'>) => http.post<Vehicle>('/vehicles', data),
  update: (id: string, data: Partial<Vehicle>) => http.put<Vehicle>(`/vehicles/${id}`, data),
  remove: (id: string) => http.delete(`/vehicles/${id}`),
};
