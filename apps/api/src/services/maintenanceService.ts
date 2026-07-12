import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createMaintenance(vehicleId: string, desc: string, cost: number, orgId: string) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findFirst({ where: { id: vehicleId, orgId } });
    if (!vehicle) throw new Error('Vehicle not found');
    const log = await tx.maintenanceLog.create({ data: { vehicleId, desc, cost, active: true } });
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'IN_SHOP' } });
    return log;
  });
}

export async function closeMaintenance(logId: string, orgId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findFirst({
      where: { id: logId, vehicle: { orgId } },
    });
    if (!log) throw new Error('Maintenance log not found');
    const updated = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { active: false, closedAt: new Date() },
    });
    const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
    if (vehicle && vehicle.status !== 'RETIRED') {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'AVAILABLE' } });
    }
    return updated;
  });
}

export async function listMaintenance(orgId: string) {
  return prisma.maintenanceLog.findMany({
    where: { vehicle: { orgId } },
    include: { vehicle: { select: { regNumber: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
