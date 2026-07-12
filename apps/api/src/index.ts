import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import vehiclesRouter from './routes/vehicles';
import driversRouter from './routes/drivers';
import tripsRouter from './routes/trips';
import maintenanceRouter from './routes/maintenance';
import fuelRouter from './routes/fuel';
import expensesRouter from './routes/expenses';
import reportsRouter from './routes/reports';
import dashboardRouter from './routes/dashboard';
import usersRouter from './routes/users';
import registrationRequestsRouter from './routes/registrationRequests';
import organizationsRouter from './routes/organizations';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);
app.use('/api/registration-requests', registrationRequestsRouter);
app.use('/api/organizations', organizationsRouter);

app.use(errorHandler);

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
