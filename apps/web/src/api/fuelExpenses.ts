import http from '../lib/http';

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
  vehicle?: { regNumber: string; name: string };
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: string;
  amount: number;
  date: string;
  vehicle?: { regNumber: string; name: string };
}

export interface OperationalCost {
  vehicleId: string;
  fuelCost: number;
  maintenanceCost: number;
  totalOperationalCost: number;
}

export const fuelApi = {
  list: () => http.get<FuelLog[]>('/fuel'),
  create: (data: Omit<FuelLog, 'id' | 'vehicle'>) => http.post<FuelLog>('/fuel', data),
  remove: (id: string) => http.delete(`/fuel/${id}`),
  operationalCost: (vehicleId: string) =>
    http.get<OperationalCost>(`/fuel/operational-cost/${vehicleId}`),
};

export const expensesApi = {
  list: () => http.get<Expense[]>('/expenses'),
  create: (data: Omit<Expense, 'id' | 'vehicle'>) => http.post<Expense>('/expenses', data),
  remove: (id: string) => http.delete(`/expenses/${id}`),
};
