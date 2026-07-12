import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { getFuelEfficiency, getUtilization, getCost, getRoi, getSummary, getMonthlyRevenue } from '../services/reportService';

const router = Router();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId!;

router.get('/summary',         async (req: AuthRequest, res, next) => { try { res.json(await getSummary(orgId(req)));        } catch (e) { next(e); } });
router.get('/monthly-revenue', async (req: AuthRequest, res, next) => { try { res.json(await getMonthlyRevenue(orgId(req))); } catch (e) { next(e); } });

router.use(requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'));

router.get('/fuel-efficiency', async (req: AuthRequest, res, next) => { try { res.json(await getFuelEfficiency(orgId(req))); } catch (e) { next(e); } });
router.get('/utilization',     async (req: AuthRequest, res, next) => { try { res.json(await getUtilization(orgId(req)));    } catch (e) { next(e); } });
router.get('/cost',            async (req: AuthRequest, res, next) => { try { res.json(await getCost(orgId(req)));           } catch (e) { next(e); } });
router.get('/roi',             async (req: AuthRequest, res, next) => { try { res.json(await getRoi(orgId(req)));            } catch (e) { next(e); } });

router.get('/export.csv', async (req: AuthRequest, res, next) => {
  try {
    const rows = await getRoi(orgId(req));
    const headers = ['regNumber', 'name', 'revenue', 'fuelCost', 'maintCost', 'acquisitionCost', 'roiPct'];
    const csv = [headers.join(','), ...rows.map(r =>
      [r.regNumber, r.name, r.revenue, r.fuelCost, r.maintCost, r.acquisitionCost, r.roiPct ?? ''].join(',')
    )].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
    res.send(csv);
  } catch (e) { next(e); }
});

export default router;
