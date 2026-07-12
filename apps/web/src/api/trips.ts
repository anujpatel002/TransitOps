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
  vehicle?: { id: string; name: string; regNumber: string };
  driver?: { id: string; name: string };
}

export const tripsApi = {
  list: () => http.get<Trip[]>('/trips'),
  create: (data: Omit<Trip, 'id' | 'createdAt' | 'vehicle' | 'driver'>) => http.post<Trip>('/trips', data),
  dispatch: (id: string) => http.post<Trip>(`/trips/${id}/dispatch`),
  complete: (id: string, finalOdometer: number, fuelConsumed: number) =>
    http.post<Trip>(`/trips/${id}/complete`, { finalOdometer, fuelConsumed }),
  cancel: (id: string) => http.post<Trip>(`/trips/${id}/cancel`),
};
