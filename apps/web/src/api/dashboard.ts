import http from '../lib/http';

export interface KPIs {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  onTrip: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
  retired: number;
  total: number;
  totalOrgs?: number;
  totalUsers?: number;
}

export const dashboardApi = {
  kpis: (params?: { type?: string; status?: string; region?: string }) =>
    http.get<KPIs>('/dashboard/kpis', { params }),
  recentTrips: () => http.get<any[]>('/dashboard/recent-trips'),
};
