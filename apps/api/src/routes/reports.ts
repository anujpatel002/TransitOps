import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { getFuelEfficiency, getUtilization, getCost, getRoi, getSummary, getMonthlyRevenue } from '../services/reportService';

const router = Router();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId ?? undefined;

router.get('/summary',         async (req: AuthRequest, res, next) => { try { res.json(await getSummary(orgId(req)));        } catch (e) { next(e); } });
router.get('/monthly-revenue', async (req: AuthRequest, res, next) => { try { res.json(await getMonthlyRevenue(orgId(req))); } catch (e) { next(e); } });

router.use(requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'ADMIN'));

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

router.get('/org-breakdown', requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const orgs = await prisma.organization.findMany({
      select: {
        name: true,
        vehicles: { select: { fuelLogs: { select: { cost: true } }, maintenance: { select: { cost: true } }, trips: { where: { status: 'COMPLETED' }, select: { plannedDist: true } } } },
      },
    });
    res.json(orgs.map(o => {
      const fuelCost  = o.vehicles.flatMap(v => v.fuelLogs).reduce((s, f) => s + f.cost, 0);
      const maintCost = o.vehicles.flatMap(v => v.maintenance).reduce((s, m) => s + m.cost, 0);
      const revenue   = o.vehicles.flatMap(v => v.trips).reduce((s, t) => s + t.plannedDist * 15, 0);
      return { name: o.name, fuelCost, maintCost, revenue, totalCost: fuelCost + maintCost };
    }));
  } catch (e) { next(e); }
});

export default router;
