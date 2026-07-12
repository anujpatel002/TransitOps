import http from '../lib/http';

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  desc: string;
  cost: number;
  active: boolean;
  createdAt: string;
  closedAt?: string;
}

export const maintenanceApi = {
  list: () => http.get<MaintenanceLog[]>('/maintenance'),
  get: (id: string) => http.get<MaintenanceLog>(`/maintenance/${id}`),
  create: (data: Omit<MaintenanceLog, 'id' | 'createdAt'>) => http.post<MaintenanceLog>('/maintenance', data),
  update: (id: string, data: Partial<MaintenanceLog>) => http.put<MaintenanceLog>(`/maintenance/${id}`, data),
};
