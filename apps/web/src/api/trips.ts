import http from '../lib/http';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDist: number;
  finalOdometer?: number;
  fuelConsumed?: number;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export const tripsApi = {
  list: () => http.get<Trip[]>('/trips'),
  get: (id: string) => http.get<Trip>(`/trips/${id}`),
  create: (data: Omit<Trip, 'id' | 'createdAt'>) => http.post<Trip>('/trips', data),
  update: (id: string, data: Partial<Trip>) => http.put<Trip>(`/trips/${id}`, data),
  remove: (id: string) => http.delete(`/trips/${id}`),
};
