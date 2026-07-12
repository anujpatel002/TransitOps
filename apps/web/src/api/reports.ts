import http from '../lib/http';

export const reportsApi = {
  summary:         () => http.get('/reports/summary'),
  fuelEfficiency:  () => http.get('/reports/fuel-efficiency'),
  utilization:     () => http.get('/reports/utilization'),
  cost:            () => http.get('/reports/cost'),
  roi:             () => http.get('/reports/roi'),
  monthlyRevenue:  () => http.get('/reports/monthly-revenue'),
  orgBreakdown:    () => http.get<{ name: string; fuelCost: number; maintCost: number; revenue: number; totalCost: number }[]>('/reports/org-breakdown'),
  exportCsv: () => {
    const token = localStorage.getItem('token');
    window.open(`/api/reports/export.csv?token=${token}`, '_blank');
  },
};
