import http from '../lib/http';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  desc: string;
  cost: number;
  active: boolean;
  createdAt: string;
  closedAt?: string;
  vehicle?: { regNumber: string; name: string };
}

export const maintenanceApi = {
  list: () => http.get<MaintenanceLog[]>('/maintenance'),
  create: (data: { vehicleId: string; desc: string; cost: number }) =>
    http.post<MaintenanceLog>('/maintenance', data),
  close: (id: string) => http.post<MaintenanceLog>(`/maintenance/${id}/close`),
};
