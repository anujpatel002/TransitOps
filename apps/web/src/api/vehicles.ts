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

export interface VehicleFilters {
  type?: string;
  status?: string;
}

export const vehiclesApi = {
  list: (filters?: VehicleFilters) => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return http.get<Vehicle[]>(`/vehicles${qs ? `?${qs}` : ''}`);
  },
  available: () => http.get<Vehicle[]>('/vehicles/available'),
  get: (id: string) => http.get<Vehicle>(`/vehicles/${id}`),
  create: (data: Omit<Vehicle, 'id'>) => http.post<Vehicle>('/vehicles', data),
  patch: (id: string, data: Partial<Vehicle>) => http.patch<Vehicle>(`/vehicles/${id}`, data),
  update: (id: string, data: Partial<Vehicle>) => http.put<Vehicle>(`/vehicles/${id}`, data),
  remove: (id: string) => http.delete(`/vehicles/${id}`),
};

