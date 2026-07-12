import http from '../lib/http';

export interface FuelLog { id: string; vehicleId: string; liters: number; cost: number; date: string; }
export interface Expense { id: string; vehicleId: string; type: string; amount: number; date: string; }

export const fuelApi = {
  list: () => http.get<FuelLog[]>('/fuel'),
  create: (data: Omit<FuelLog, 'id'>) => http.post<FuelLog>('/fuel', data),
  remove: (id: string) => http.delete(`/fuel/${id}`),
};

export const expensesApi = {
  list: () => http.get<Expense[]>('/expenses'),
  create: (data: Omit<Expense, 'id'>) => http.post<Expense>('/expenses', data),
  remove: (id: string) => http.delete(`/expenses/${id}`),
};
