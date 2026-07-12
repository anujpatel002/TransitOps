import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { requireAccess } from '../middleware/requireRole';
import { getFuelEfficiency, getUtilization, getCost, getRoi, getSummary, getMonthlyRevenue } from '../services/reportService';

const router = Router();
router.use(verifyToken);
router.use(requireAccess('analytics'));

router.get('/fuel-efficiency', async (_req, res, next) => {
  try { res.json(await getFuelEfficiency()); } catch (e) { next(e); }
});

router.get('/utilization', async (_req, res, next) => {
  try { res.json(await getUtilization()); } catch (e) { next(e); }
});

router.get('/cost', async (_req, res, next) => {
  try { res.json(await getCost()); } catch (e) { next(e); }
});

router.get('/roi', async (_req, res, next) => {
  try { res.json(await getRoi()); } catch (e) { next(e); }
});

router.get('/monthly-revenue', async (_req, res, next) => {
  try { res.json(await getMonthlyRevenue()); } catch (e) { next(e); }
});

router.get('/summary', async (_req, res, next) => {
  try { res.json(await getSummary()); } catch (e) { next(e); }
});

router.get('/export.csv', async (_req, res, next) => {
  try {
    const rows = await getRoi();
    const headers = ['regNumber', 'name', 'revenue', 'fuelCost', 'maintCost', 'acquisitionCost', 'roiPct'];
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [r.regNumber, r.name, r.revenue, r.fuelCost, r.maintCost, r.acquisitionCost, r.roiPct ?? ''].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

export default router;
